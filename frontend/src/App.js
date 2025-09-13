import React from "react";
import QuizSwiper from "./components/QuizSwiper";
import HomeCard from "./components/HomeCard";
import Login from "./pages/Login";

export default function App() {
  return (
    <div>
      <HomeCard
        width={360}
        height={560}
        onChoose={(val) => console.log("Picked:", val)}
      />
      <QuizSwiper
        width={360}
        height={560}
        durationMs={320}
        onSubmit={(answers) => console.log("answers:", answers)}
      />
    </div>
  );
}