import React from "react";

export default function QuizPage({ page, answers, onChange }) {
  const toggle = (fieldId, value, type) => {
    const prev = answers?.[fieldId];
    if (type === "multi") {
      const set = new Set(Array.isArray(prev) ? prev : []);
      set.has(value) ? set.delete(value) : set.add(value);
      onChange(fieldId, Array.from(set));
    } else {
      onChange(fieldId, value);
    }
  };

  const isSelected = (fieldId, value) => {
    const v = answers?.[fieldId];
    return Array.isArray(v) ? v.includes(value) : v === value;
  };

  if (!page) return null;

  return (
    <div className="page">
      {page.title && <h2 className="page-title">{page.title}</h2>}

      {(page.fields || []).map((f) => {
        const type = f.type || "multi";
        const opts = Array.isArray(f.options) ? f.options : [];

        // --- TEXT / TEXTAREA FIELD ---
        if (type === "text" || type === "textarea") {
          const val = (answers?.[f.id] ?? "");
          return (
            <div className="field" key={f.id}>
              {f.label && <div className="field-label">{f.label}</div>}
              {type === "textarea" ? (
                <textarea
                  rows={f.rows || 3}
                  placeholder={f.placeholder || "Type here..."}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={val}
                  maxLength={f.maxLength}
                  onChange={(e) => onChange(f.id, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  placeholder={f.placeholder || "Type here..."}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={val}
                  maxLength={f.maxLength}
                  onChange={(e) => onChange(f.id, e.target.value)}
                />
              )}
              {f.helper && (
                <p className="mt-2 text-sm text-slate-500">{f.helper}</p>
              )}
            </div>
          );
        }

        // --- MULTI / SINGLE OPTION FIELDS (existing behavior) ---
        return (
          <div className="field" key={f.id}>
            {f.label && <div className="field-label">{f.label}</div>}
            <div className="pill-row">
              {opts.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`pill ${isSelected(f.id, opt) ? "pill--active" : ""}`}
                  onClick={() => toggle(f.id, opt, f.type)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Chips for selected (if multi) */}
            {/* {f.type === "multi" && Array.isArray(answers?.[f.id]) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {answers[f.id].map((opt) => (
                  <span key={opt} className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    {opt}
                    <button
                      type="button"
                      className="ml-1 rounded-full p-0.5 hover:bg-slate-200"
                      onClick={() => toggle(f.id, opt, "multi")}
                      aria-label={`Remove ${opt}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )} */}

            {/* Optional helper / constraints
            {(f.max || f.requiredCount || f.helper) && (
              <p className="mt-2 text-sm text-slate-500">
                {f.helper ??
                  (f.requiredCount
                    ? `Select exactly ${f.requiredCount}.`
                    : f.max
                    ? `You can choose up to ${f.max}.`
                    : "")}
              </p>
            )} */}
          </div>
        );
      })}
    </div>
  );
}