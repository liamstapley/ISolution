// src/quizzes/LocationQuiz.jsx
import React, { useMemo, useRef, useState } from "react";
import QuizPage from "./QuizPage";          // same renderer you already use
import "./quiz.css";
import "./TextSwiper.css";

export default function LocationQuiz({
  width = 360,
  height = 560,
  durationMs = 320,
  onDone,              // parent should route back to Additional Info
  log                  // optional: async (sectionKey, payload) => Promise<void>
}) {
  // One-page quiz definition
  const pages = useMemo(() => [
    {
      id: "locationPage",
      title: "Where are you located?",
      fields: [
        {
          id: "location",
          label: "Tell us your city, state/province, and country.",
          type: "text",             // open-ended
          placeholder: "e.g., Newark, Delaware, USA",
          required: true,
          maxLength: 120            // optional hint if your QuizPage supports it
        }
      ]
    }
  ], []);

  // Swiper state (same pattern as PersonalityQuiz)
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle");   // idle | exit | enter
  const [dir, setDir] = useState("right");
  const nextIndexRef = useRef(index);

  const [answers, setAnswers] = useState({});   // { location: string }
  const [submitting, setSubmitting] = useState(false);

  const total = pages.length;                   // = 1
  const page = pages[index];

  const stageStyle = { width, height, "--duration": `${durationMs}ms` };
  let boxClass = "box";
  if (phase === "exit")  boxClass += dir === "right" ? " slide-exit-left"  : " slide-exit-right";
  if (phase === "enter") boxClass += dir === "right" ? " slide-enter-right" : " slide-enter-left";

  const animateTo = (direction, nextIdx) => {
    if (phase !== "idle") return;
    setDir(direction);
    nextIndexRef.current = (nextIdx + total) % total;
    setPhase("exit");
    setTimeout(() => {
      setIndex(nextIndexRef.current);
      setPhase("enter");
      setTimeout(() => setPhase("idle"), durationMs);
    }, durationMs);
  };

  const goPrev = () => animateTo("left", index - 1);   // (disabled on first/only page)

  const handleChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Require a non-empty location
  const pageIsValid = useMemo(() => {
    const fld = page.fields[0];
    const v = answers[fld.id];
    return typeof v === "string" && v.trim().length > 0;
  }, [page, answers]);

  const submit = async () => {
    if (!pageIsValid || submitting) return;
    setSubmitting(true);
    try {
      if (typeof log === "function") {
        await log("location", { location: (answers.location || "").trim() });
      } else if (typeof window !== "undefined" && typeof window.logQuizResult === "function") {
        await window.logQuizResult("location", { location: (answers.location || "").trim() });
      } else {
        console.log("[Quiz Log] location:", (answers.location || "").trim());
      }
      onDone?.({ location: (answers.location || "").trim() });  // parent navigates back to Additional Information
    } catch (e) {
      console.error("Failed to save location:", e);
      alert(e.message || "Failed to save your location");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quiz-root">
      <div className="swiper" tabIndex={0}>
        {/* Left arrow (disabled on single-page quiz) */}
        <button className="arrow" onClick={goPrev} disabled>
          {"<"}
        </button>

        {/* Sliding rectangle stage */}
        <div className="stage" style={stageStyle}>
          <div className={boxClass}>
            <div className="content">
              <QuizPage page={page} answers={answers} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Right arrow acts as Submit */}
        <button
          className="arrow"
          onClick={submit}
          disabled={!pageIsValid || submitting}
          title={!pageIsValid ? "Please enter your location" : ""}
        >
          {">"}
        </button>
      </div>

      {/* Footer with a single primary action */}
      <div className="quiz-footer">
        <div className="dots">
          <span className="dot dot--active" />
        </div>
        <div className="footer-actions">
          <button
            className="primary-btn"
            onClick={submit}
            disabled={!pageIsValid || submitting}
          >
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
