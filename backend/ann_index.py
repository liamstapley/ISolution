# ann_index.py
from __future__ import annotations
import os, json, threading
from pathlib import Path
from typing import Iterable, List, Tuple, Optional, Literal
import numpy as np
import hnswlib

IndexKey = Tuple[str, Literal["RETRIEVAL_DOCUMENT"], int]  # (model_name, task_type, dim)

# Where to persist indices
INDEX_DIR = Path(os.getenv("ANN_INDEX_DIR", "./indices"))
INDEX_DIR.mkdir(parents=True, exist_ok=True)

# In-memory registry of loaded indices + a lock
_registry = {}
_lock = threading.Lock()

def _paths(key: IndexKey):
    model, task, dim = key
    stem = f"{model}__{task}__{dim}"
    return (INDEX_DIR / f"{stem}.bin", INDEX_DIR / f"{stem}.meta.json")

def _save_meta(meta_path: Path, space: str, ef: int, M: int):
    meta_path.write_text(json.dumps({"space": space, "ef": ef, "M": M}))

def _load_meta(meta_path: Path):
    return json.loads(meta_path.read_text())

def _ensure_loaded(key: IndexKey, dim: int, space="cosine", ef_construction=200, M=32, allow_create=True):
    """Load an index into memory if present, else create a new one if allow_create."""
    with _lock:
        if key in _registry:
            return _registry[key]

        bin_path, meta_path = _paths(key)
        idx = hnswlib.Index(space=space, dim=dim)
        if bin_path.exists() and meta_path.exists():
            meta = _load_meta(meta_path)
            idx.load_index(str(bin_path), max_elements=0)  # 0 means read from file
            # Set a reasonable ef for queries
            idx.set_ef(64)
        else:
            if not allow_create:
                return None
            # Initialize empty index with capacity; we can grow later
            # Choose a generous capacity to reduce rebuilds; you can tune this.
            idx.init_index(max_elements=50_000, ef_construction=ef_construction, M=M)
            idx.set_ef(64)
            _save_meta(meta_path, space, 64, M)
            # Persist empty index
            idx.save_index(str(bin_path))

        _registry[key] = idx
        return idx

def add_or_update(
    key: IndexKey,
    dim: int,
    embeddings: Iterable[Tuple[int, List[float]]],  # (label=event_id, vector)
):
    """
    Upsert by label (event_id).
    For hnswlib: to update, delete the label then add again.
    """
    idx = _ensure_loaded(key, dim)
    if idx is None:
        raise RuntimeError("Index not loaded and creation not allowed.")

    labels = []
    vecs = []
    for label, vec in embeddings:
        v = np.asarray(vec, dtype=np.float32)
        if v.shape[0] != dim:
            raise ValueError(f"Vector dim {v.shape[0]} != expected {dim}")
        labels.append(label)
        vecs.append(v)

    if not labels:
        return

    labels_np = np.array(labels, dtype=np.int64)
    vecs_np = np.vstack(vecs)

    # delete existing labels (if present)
    try:
        idx.mark_deleted_multi(labels_np)
    except Exception:
        # Some versions don’t expose multi-delete. Fall back to single deletes.
        for l in labels:
            try:
                idx.mark_deleted(l)
            except Exception:
                pass

    # Grow capacity if needed
    try:
        idx.add_items(vecs_np, labels_np, replace_deleted=True)
    except RuntimeError as e:
        # Usually means capacity too low; grow and retry
        cur_cap = idx.get_max_elements()
        new_cap = max(cur_cap * 2, cur_cap + len(labels) * 4)
        idx.resize_index(new_cap)
        idx.add_items(vecs_np, labels_np, replace_deleted=True)

    # Persist
    bin_path, _ = _paths(key)
    idx.save_index(str(bin_path))

def rebuild(
    key: IndexKey,
    dim: int,
    all_items: Iterable[Tuple[int, List[float]]],
    space="cosine",
    ef_construction=200,
    M=32,
):
    """Rebuild from scratch (useful if you change params or want a clean slate)."""
    with _lock:
        # Fresh index
        idx = hnswlib.Index(space=space, dim=dim)
        items = list(all_items)
        max_elements = max(1000, len(items) * 2)
        idx.init_index(max_elements=max_elements, ef_construction=ef_construction, M=M)
        idx.set_ef(64)

        if items:
            labels_np = np.array([lab for lab, _ in items], dtype=np.int64)
            vecs_np = np.vstack([np.asarray(v, dtype=np.float32) for _, v in items])
            idx.add_items(vecs_np, labels_np)

        # Persist
        bin_path, meta_path = _paths(key)
        idx.save_index(str(bin_path))
        _save_meta(meta_path, space, 64, M)

        _registry[key] = idx
        return len(items)

def search(
    key: IndexKey,
    dim: int,
    query_vec: List[float],
    k: int = 10,
) -> List[Tuple[int, float]]:
    idx = _ensure_loaded(key, dim, allow_create=False)
    if idx is None:
        return []

    q = np.asarray(query_vec, dtype=np.float32)
    if q.shape[0] != dim:
        raise ValueError(f"Query dim {q.shape[0]} != expected {dim}")

    size = idx.get_current_count()
    if size <= 0:
        return []

    # hnswlib cannot return more neighbors than exist (reliably) in tiny graphs
    k_eff = min(k, size)

    # Set ef defensively: at least 4*k, but also reasonable upper bound
    try:
        idx.set_ef(max(64, min(1024, 4 * k_eff)))
        labels, dists = idx.knn_query(q, k=k_eff)
    except RuntimeError:
        # Retry with a much higher ef
        idx.set_ef(max(128, min(2048, 8 * k_eff)))
        labels, dists = idx.knn_query(q, k=k_eff)

    labs = labels[0].tolist()
    ds   = dists[0].tolist()
    # Filter out hnswlib's -1 placeholders if any
    out = [(int(l), float(d)) for l, d in zip(labs, ds) if l is not None and int(l) >= 0]
    return out


# ann_index.py (add this near the top-level helpers)
def index_exists(key: IndexKey) -> bool:
    bin_path, meta_path = _paths(key)
    return bin_path.exists() and meta_path.exists()
