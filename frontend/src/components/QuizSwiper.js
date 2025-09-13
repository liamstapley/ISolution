import React, { useMemo, useRef, useState } from "react";
import quizPages from "../quizPages";
import QuizPage from "./QuizPage";
import "./quiz.css";
import "./TextSwiper.css"; // reuse your swiper animations (box, stage, etc.)

export default function QuizSwiper({
  width = 360,
  height = 560,
  durationMs = 320,
  onDone // optional callback(answers)
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle"); // idle | exit | enter
  const [dir, setDir] = useState("right");
  const [answers, setAnswers] = useState({});
  const nextIndexRef = useRef(index);

  const total = quizPages.length;
  const page = quizPages[index];

  const handleChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const pageIsValid = useMemo(() => {
    // require all required fields; multi must meet minSelect
    return page.fields.every((f) => {
      if (!f.required) return true;
      const v = answers[f.id];
      if (f.type === "multi") {
        const min = f.minSelect || 1;
        return Array.isArray(v) && v.length >= min;
      }
      return Boolean(v);
    });
  }, [page, answers]);

  const clampIndex = (i) => (i + total) % total;

  const animateTo = (direction, nextIdx) => {
    if (phase !== "idle") return;
    setDir(direction);
    nextIndexRef.current = clampIndex(nextIdx);
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

  const submit = async () => {
    if (onDone) onDone(answers);
    // Example POST to your FastAPI backend:
    // await fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answers) });
    alert("Submitted! " + JSON.stringify(answers, null, 2));
  };

  // wire up style vars
  const stageStyle = { width, height, "--duration": `${durationMs}ms` };

  let boxClass = "box";
  if (phase === "exit") {
    boxClass += dir === "right" ? " slide-exit-left" : " slide-exit-right";
  } else if (phase === "enter") {
    boxClass += dir === "right" ? " slide-enter-right" : " slide-enter-left";
  }

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
          onClick={index === total - 1 ? submit : goNext}
          disabled={index < total - 1 && !pageIsValid}
          aria-disabled={index < total - 1 && !pageIsValid}
          title={index < total - 1 && !pageIsValid ? "Select required options" : ""}
        >
          {index === total - 1 ? ">" : ">"}
        </button>
      </div>

      {/* Progress + actions */}
      <div className="quiz-footer">
        <div className="dots">
          {quizPages.map((_, i) => (
            <span key={i} className={`dot ${i === index ? "dot--active" : ""}`} />
          ))}
        </div>

        <div className="footer-actions">
          {index > 0 && (
            <button className="ghost-btn" onClick={goPrev}>Back</button>
          )}
          {index < total - 1 ? (
            <button className="primary-btn" onClick={goNext} disabled={!pageIsValid}>
              Next
            </button>
          ) : (
            <button className="primary-btn" onClick={submit}>Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}