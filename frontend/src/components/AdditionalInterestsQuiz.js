import React, { useMemo, useState } from "react";
import "./AdditionalInterestsQuiz.css";

/**
 * AdditionalInterestsQuiz
 * Two-step quiz: Interests (step 0) and Causes (step 1).
 * - Each step uses a dropdown-style multi-select (max 3 selections)
 * - Selections render as removable bubbles (chips)
 * - On Finish: logs results the same way as prior quizzes, then navigates back to the Additional Information page
 *
 * Props (all optional):
 * - onDone: () => void  // called after successful submit
 * - log: async (sectionKey: string, payload: any) => Promise<void> // your app's logging fn
 * - navigateToAdditional: () => void // custom navigation back to Additional Info page
 */
export default function AdditionalInterestsQuiz({ onDone, log, navigateToAdditional }) {
  const INTEREST_OPTIONS = useMemo(
    () => [
      "Music","Art","Reading","Hiking","Coding","Math","Science","Photography","Writing","Cooking","Gardening","Traveling","Fitness","Running","Cycling","Yoga","Gaming","Film","Theater","Dance","Volunteering","Entrepreneurship","Robotics","Languages","Chess",
    ],
    []
  );

  const CAUSE_OPTIONS = useMemo(
    () => [
      "Environment","Climate Action","Animal Welfare","Wildlife Conservation","Education Equity","Literacy","Public Health","Mental Health","Disability Rights & Accessibility","Racial Justice","Gender Equality","LGBTQ+ Rights","Poverty Alleviation","Homelessness Relief","Food Security","Clean Water & Sanitation","Criminal Justice Reform","Voting Rights & Civic Engagement","Immigration & Refugee Support","Human Rights","Anti-Corruption & Government Transparency","Digital Privacy & Data Rights","AI Safety & Ethics","Arts & Culture Access","Veteran Support",
    ],
    []
  );

  const [step, setStep] = useState(0); // 0 = Interests, 1 = Causes
  const [interests, setInterests] = useState([]);
  const [causes, setCauses] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Try to log using app-provided function or window fallback
      const logSection = async (section, data) => {
        if (typeof log === "function") {
          await log(section, data);
        } else if (typeof window !== "undefined" && typeof window.logQuizResult === "function") {
          await window.logQuizResult(section, data);
        } else {
          console.log("[Quiz Log]", section, data);
        }
      };

      await logSection("interests", { selected: interests });
      await logSection("causes", { selected: causes });

      // Navigate back to Additional Information page
      if (typeof navigateToAdditional === "function") {
        navigateToAdditional();
      } else if (typeof window !== "undefined" && window?.__APP_NAVIGATE__) {
        window.__APP_NAVIGATE__("/additional");
      } else if (typeof window !== "undefined") {
        window.location.href = "/additional"; // simple fallback
      }

      if (typeof onDone === "function") onDone();
    } catch (e) {
      console.error("Failed to submit AdditionalInterestsQuiz:", e);
      alert("Sorry, something went wrong saving your answers.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] w-full max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Progress step={step} total={2} />

      {step === 0 ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Your Interests</h1>
          <p className="text-slate-600">Pick up to 3 that you enjoy most.</p>

          <MultiSelectDropdown
            label="Select interests"
            options={INTEREST_OPTIONS}
            selected={interests}
            setSelected={setInterests}
            max={3}
          />

          <div className="flex justify-between pt-2">
            <button
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold shadow-sm"
              onClick={() => setStep(1)}
            >
              Skip →
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-md disabled:opacity-50"
              onClick={() => setStep(1)}
            >
              Next: Causes
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Causes You Care About</h1>
          <p className="text-slate-600">Pick up to 3 causes you believe in.</p>

          <MultiSelectDropdown
            label="Select causes"
            options={CAUSE_OPTIONS}
            selected={causes}
            setSelected={setCauses}
            max={3}
          />

          <div className="flex justify-between pt-2">
            <button
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold shadow-sm"
              onClick={() => setStep(0)}
            >
              ← Back
            </button>
            <button
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-md disabled:opacity-50"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Saving..." : "Finish"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ label, options, selected, setSelected, max = 3 }) {
  const [open, setOpen] = useState(false);
  const limitReached = selected.length >= max;

  const toggle = (opt) => {
    const exists = selected.includes(opt);
    if (exists) {
      setSelected(selected.filter((o) => o !== opt));
    } else {
      if (limitReached) return;
      setSelected([...selected, opt]);
    }
  };

  return (
    <div className="w-full">
      <div className="relative">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm hover:shadow-md"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-left text-slate-700 font-medium">
            {selected.length ? `${label} (${selected.length}/${max})` : label}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <ul className="divide-y divide-slate-100">
              {options.map((opt) => {
                const active = selected.includes(opt);
                const disabled = !active && limitReached;
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => toggle(opt)}
                      disabled={disabled}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm ${
                        disabled ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50"
                      } ${active ? "bg-blue-50" : ""}`}
                    >
                      <span>{opt}</span>
                      {active && (
                        <span className="text-xs font-semibold text-blue-700">Selected</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {selected.map((opt) => (
          <Chip key={opt} label={opt} onRemove={() => toggle(opt)} />
        ))}
      </div>

      <p className="mt-2 text-sm text-slate-500">You can choose up to {max}.</p>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
      {label}
      <button
        type="button"
        className="ml-1 rounded-full p-0.5 hover:bg-slate-200"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </span>
  );
}

function Progress({ step, total }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700">Additional Info Quiz</span>
        <span className="text-sm text-slate-500">Step {step + 1} of {total}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
