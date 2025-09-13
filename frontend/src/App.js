import React, { useState } from "react";
import HomeCard from "./components/HomeCard";
import VolunteerCard from "./components/VolunteerCard";
import "./components/TextSwiper.css"; // provides .stage, .box, .content

export default function App() {
  const [view, setView] = useState("home");

  return (
    <div className="center-page">
      {view === "home" ? (
        <HomeCard
          width={360}
          height={560}
          onChoose={(val) => { if (val === "volunteer") setView("volunteer"); }}
        />
      ) : (
        <VolunteerCard width={360} height={560} onBack={() => setView("home")} />
      )}
    </div>
  );
}