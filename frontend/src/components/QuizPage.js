import React from "react";

export default function QuizPage({ page, answers, onChange }) {
  const toggle = (fieldId, value, type) => {
    const prev = answers[fieldId];
    if (type === "multi") {
      const set = new Set(prev || []);
      set.has(value) ? set.delete(value) : set.add(value);
      onChange(fieldId, Array.from(set));
    } else {
      onChange(fieldId, value);
    }
  };

  const isSelected = (fieldId, value) => {
    const v = answers[fieldId];
    return Array.isArray(v) ? v.includes(value) : v === value;
  };

  return (
    <div className="page">
      <h2 className="page-title">{page.title}</h2>

      {page.fields.map((f) => (
        <div className="field" key={f.id}>
          <div className="field-label">{f.label}</div>
          <div className="pill-row">
            {f.options.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`pill ${isSelected(f.id, opt) ? "pill--active" : ""}`}
                onClick={() => toggle(f.id, opt, f.type)}
                aria-pressed={isSelected(f.id, opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}