import React, { useMemo, useRef, useState } from "react";
import QuizPage from "./QuizPage";              // your shared renderer
import "./quiz.css";
import "./TextSwiper.css";

/**
 * AdditionalInterestsQuiz (Swiper)
 * - Two pages, both require EXACTLY 3 picks to advance.
 * - Fields are declared as dropdown multi-selects; selected items show as chips.
 * - onDone() is the ONLY navigation (parent should route back to Additional Info).
 * - Optional `log(sectionKey, payload)` preserves your logging.
 */
export default function AdditionalInterestsQuiz({
  onDone,
  log,
  width = 360,
  height = 560,
  durationMs = 320
}) {
  // ----- Options -----
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

  // ----- Pages (consumed by QuizPage) -----
  // Hints: ui="dropdown", chips=true; requiredCount=3 to enforce exactly 3
  const pages = useMemo(
    () => [
      {
        id: "interestsPage",
        title: "Your Interests",
        fields: [
          {
            id: "interests",
            label: "Pick exactly 3 interests",
            type: "multi",
            options: INTEREST_OPTIONS,
            ui: "dropdown",
            chips: true,
            max: 3,
            requiredCount: 3
          },
        ],
      },
      {
        id: "causesPage",
        title: "Causes You Care About",
        fields: [
          {
            id: "causes",
            label: "Pick exactly 3 causes",
            type: "multi",
            options: CAUSE_OPTIONS,
            ui: "dropdown",
            chips: true,
            max: 3,
            requiredCount: 3
          },
        ],
      },
    ],
    [INTEREST_OPTIONS, CAUSE_OPTIONS]
  );

  // ----- Swiper state (same pattern as PersonalityQuiz) -----
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [dir, setDir] = useState("right");
  const nextIndexRef = useRef(index);

  // ----- Answers -----
  // { interests: string[], causes: string[] }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const total = pages.length;
  const page = pages[index];

  const clamp = (i) => (i + total) % total;

  const animateTo = (direction, nextIdx) => {
    if (phase !== "idle") return;
    setDir(direction);
    nextIndexRef.current = clamp(nextIdx);
    setPhase("exit");
    setTimeout(() => {
      setIndex(nextIndexRef.current);
      setPhase("enter");
      setTimeout(() => setPhase("idle"), durationMs);
    }, durationMs);
  };

  const goNext = () => {
    if (index === total - 1) return;
    animateTo("right", index + 1);
  };

  const goPrev = () => animateTo("left", index - 1);

  // Cap and de-dup multi-select values; `QuizPage` should call onChange(fieldId, value)
  const handleChange = (fieldId, value) => {
    setAnswers((prev) => {
      let nextVal = value;
      if (Array.isArray(value)) {
        // find current field descriptor (from any page)
        const fld = pages.flatMap(p => p.fields).find(f => f.id === fieldId);
        const max = fld?.max ?? Infinity;
        const uniq = Array.from(new Set(value));
        nextVal = uniq.slice(0, max);
      }
      return { ...prev, [fieldId]: nextVal };
    });
  };

  // EXACTLY-3 validator for each page
  const pageIsValid = (() => {
    return page.fields.every((f) => {
      const v = answers[f.id];
      if (f.requiredCount != null) {
        return Array.isArray(v) && v.length === f.requiredCount;
      }
      if (f.required) {
        return Array.isArray(v) ? v.length > 0 : Boolean(v);
      }
      return true;
    });
  })();

  const submit = async () => {
    const interests = Array.isArray(answers.interests) ? answers.interests : [];
    const causes = Array.isArray(answers.causes) ? answers.causes : [];

    // Guard: enforce exactly 3 on final submit too
    if (interests.length !== 3 || causes.length !== 3) return;

    const logSection = async (section, data) => {
      if (typeof log === "function") return log(section, data);
      if (typeof window !== "undefined" && typeof window.logQuizResult === "function") {
        return window.logQuizResult(section, data);
      }
      // fallback logging
      console.log("[Quiz Log]", section, data);
    };

    setSubmitting(true);
    try {
      await logSection("interests", { selected: interests });
      await logSection("causes", { selected: causes });
      onDone?.(); // parent handles navigation back to Additional Info
    } catch (e) {
      console.error("Failed to save Additional Interests/Causes:", e);
      alert(e.message || "Failed to save your answers");
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Stage / Anim classes -----
  const stageStyle = { width, height, "--duration": `${durationMs}ms` };
  let boxClass = "box";
  if (phase === "exit") {
    boxClass += dir === "right" ? " slide-exit-left" : " slide-exit-right";
  } else if (phase === "enter") {
    boxClass += dir === "right" ? " slide-enter-right" : " slide-enter-left";
  }

  // CTA state
  const atLast = index === total - 1;
  const nextDisabled = !pageIsValid;
  const submitDisabled = submitting || !pageIsValid; // page 2 must also be exactly 3

  return (
    <div className="quiz-root">
      <div className="swiper" tabIndex={0}>
        <button className="arrow" onClick={goPrev} disabled={index === 0}>
          {"<"}
        </button>

        <div className="stage" style={stageStyle}>
          <div className={boxClass}>
            <div className="content">
              <QuizPage page={page} answers={answers} onChange={handleChange} />
            </div>
          </div>
        </div>

        <button
          className="arrow"
          onClick={atLast ? submit : goNext}
          disabled={atLast ? submitDisabled : nextDisabled}
          title={
            atLast
              ? submitDisabled ? "Select exactly 3 to finish" : ""
              : nextDisabled ? "Select exactly 3 to continue" : ""
          }
        >
          {">"}
        </button>
      </div>

      <div className="quiz-footer">
        <div className="dots">
          {pages.map((_, i) => (
            <span key={i} className={`dot ${i === index ? "dot--active" : ""}`} />
          ))}
        </div>

        <div className="footer-actions">
          {index > 0 && (
            <button className="ghost-btn" onClick={goPrev}>Back</button>
          )}

          {!atLast ? (
            <button className="primary-btn" onClick={goNext} disabled={nextDisabled}>
              Next
            </button>
          ) : (
            <button className="primary-btn" onClick={submit} disabled={submitDisabled}>
              {submitting ? "Saving..." : "Finish"}
            </button>
          )}
        </div>

        <div className="helper text-sm text-slate-500 mt-2">
          Choose exactly 3 on each step. Use the dropdown to pick, and remove a chip to change your selection.
        </div>
      </div>
    </div>
  );
}