import React, { useMemo, useRef, useState } from "react";
import personalityPages from "../personalityPages";
import QuizPage from "./QuizPage";        // same renderer you already have
import "./quiz.css";                      // same styles as the original survey
import "./TextSwiper.css";                // .stage, .box, .content, animations

export default function PersonalityQuiz({
  width = 360,
  height = 560,
  durationMs = 320,
  onDone // callback(answers) -> navigate back to Additional Info
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [dir, setDir] = useState("right");
  const [answers, setAnswers] = useState({});
  const nextIndexRef = useRef(index);

  const pages = personalityPages;
  const total = pages.length;
  const page = pages[index];

  const handleChange = (fieldId, value) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const pageIsValid = useMemo(() => {
    return page.fields.every((f) => {
      if (!f.required) return true;
      const v = answers[f.id];
      return Array.isArray(v) ? v.length > 0 : Boolean(v);
    });
  }, [page, answers]);

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

  const submit = () => {
    // Output answers in the same format (fieldId: value)
    console.log("Personality Quiz Results:", answers);
    alert("Personality Quiz Results:\n" + JSON.stringify(answers, null, 2));
    onDone?.(answers); // parent will send user back to Additional Info
  };

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
          title={index < total - 1 && !pageIsValid ? "Select required options" : ""}
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