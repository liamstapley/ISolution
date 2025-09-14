# ann_index.py
from __future__ import annotations
from typing import Dict, Tuple, List, Iterable
import os, threading
import numpy as np
import hnswlib

IndexKey = Tuple[str, str, int]  # (model_name, task_type, dim)

# Tune these as you like
_DEFAULT_M = 32
_DEFAULT_EF_CONSTRUCTION = 200
_DEFAULT_EF = 128

_DATA_DIR = os.environ.get("ANN_STORE_DIR", ".ann_store")
os.makedirs(_DATA_DIR, exist_ok=True)

def _fname(key: IndexKey) -> str:
    m, t, d = key
    safe = f"{m}__{t}__{d}".replace("/", "_")
    return os.path.join(_DATA_DIR, f"{safe}.hnsw")

class _Index:
    def __init__(self, space: str, dim: int, key: IndexKey):
        self.space = space
        self.dim = dim
        self.key = key
        self.path = _fname(key)
        self.lock = threading.RLock()
        self.index = None          # type: hnswlib.Index
        self.labels = set()        # track labels present

    def _init_new(self, max_elements: int):
        self.index = hnswlib.Index(space=self.space, dim=self.dim)
        self.index.init_index(max_elements=max(max_elements, 1), M=_DEFAULT_M, ef_construction=_DEFAULT_EF_CONSTRUCTION)
        self.index.set_ef(_DEFAULT_EF)

    def _load_or_new(self, expected_capacity: int):
        if os.path.exists(self.path):
            self.index = hnswlib.Index(space=self.space, dim=self.dim)
            self.index.load_index(self.path, max_elements=expected_capacity or 1)
            self.index.set_ef(_DEFAULT_EF)
            # hnswlib doesn’t persist an easy label list; we rebuild lazily as we add.
            # (We’ll keep labels in-memory across this process; safe enough for dev.)
        else:
            self._init_new(expected_capacity)

    def save(self):
        if self.index is not None:
            self.index.save_index(self.path)

# Global registry of indices
_REGISTRY: Dict[IndexKey, _Index] = {}
_REG_LOCK = threading.RLock()

def _get_index(key: IndexKey, dim: int, capacity_hint: int = 0) -> _Index:
    with _REG_LOCK:
        ix = _REGISTRY.get(key)
        if ix is None:
            ix = _Index(space="cosine", dim=dim, key=key)
            ix._load_or_new(capacity_hint)
            _REGISTRY[key] = ix
        return ix

def _ensure_capacity(ix: _Index, need: int):
    # hnswlib can grow via resize_index
    cur_max = ix.index.get_max_elements()
    cur_cnt = ix.index.get_current_count()
    if cur_cnt + need > cur_max:
        ix.index.resize_index(max(cur_cnt + need, int(cur_max * 1.5) + 64))

def add_or_update(
    key: IndexKey,
    dim: int,
    embeddings: Iterable[Tuple[int, List[float]]],
) -> int:
    """
    Upsert items into the index. Each item is (label, vector).
    Returns how many items were added.
    """
    ix = _get_index(key, dim, capacity_hint=0)
    labels, vecs = [], []
    for lab, vec in embeddings:
        if len(vec) != dim:
            continue
        labels.append(int(lab))
        vecs.append(vec)

    if not labels:
        return 0

    with ix.lock:
        _ensure_capacity(ix, len(labels))
        # Normalize input shape
        arr = np.array(vecs, dtype=np.float32)
        labs = np.array(labels, dtype=np.int64)

        # If a label already exists, mark it deleted (so new insert replaces it)
        # hnswlib supports replace_deleted=True in add_items to reuse deleted slots.
        # We’ll do a best-effort delete for labels we’ve seen in this process.
        to_del = [lab for lab in labels if lab in ix.labels]
        for lab in to_del:
            try:
                ix.index.mark_deleted(lab)
            except RuntimeError:
                pass  # was not present; continue

        ix.index.add_items(arr, labs, replace_deleted=True)
        ix.labels.update(labels)
        ix.save()
        return len(labels)

def rebuild(
    key: IndexKey,
    dim: int,
    all_items: Iterable[Tuple[int, List[float]]],
) -> int:
    """
    Rebuilds the index from scratch with all given items.
    """
    items = [(int(lab), vec) for (lab, vec) in all_items if len(vec) == dim]
    labels = [lab for lab, _ in items]
    if not items:
        # Create empty index so subsequent upserts work
        ix = _get_index(key, dim, capacity_hint=1)
        with ix.lock:
            ix._init_new(max_elements=1)
            ix.labels = set()
            ix.save()
        return 0

    arr = np.array([vec for _, vec in items], dtype=np.float32)
    labs = np.array(labels, dtype=np.int64)

    ix = _get_index(key, dim, capacity_hint=len(items))
    with ix.lock:
        ix._init_new(max_elements=len(items))
        ix.index.add_items(arr, labs)
        ix.index.set_ef(_DEFAULT_EF)
        ix.labels = set(labels)
        ix.save()
    return len(items)

def search(
    key: IndexKey,
    dim: int,
    query_vec: List[float],
    k: int = 10,
) -> List[Tuple[int, float]]:
    """
    Returns list of (label, distance) with hnswlib cosine space (0..2, lower is closer).
    """
    ix = _get_index(key, dim, capacity_hint=0)
    if ix.index is None or not ix.labels:
        return []
    q = np.asarray([query_vec], dtype=np.float32)
    with ix.lock:
        labels, distances = ix.index.knn_query(q, k=min(k, max(1, len(ix.labels))))
    labs = labels[0].tolist()
    dists = distances[0].tolist()
    return list(zip([int(x) for x in labs], [float(d) for d in dists]))
