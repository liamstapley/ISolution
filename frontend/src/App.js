import React from "react";
import QuizSwiper from "./components/QuizSwiper";

export default function App() {
  return (
    <div>
      <QuizSwiper
        width={360}
        height={560}
        durationMs={320}
        onSubmit={(answers) => console.log("answers:", answers)}
      />
    </div>
  );
}