import React, { useState } from "react";
import HomeCard from "./components/HomeCard";
import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";   // <-- add this
import "./components/TextSwiper.css";

export default function App() {
  const [view, setView] = useState("home");

  return (
    <div className="center-page">
      {view === "home" && (
        <HomeCard
          width={360}
          height={560}
          onChoose={(val) => {
            if (val === "volunteer") setView("volunteer");
            if (val === "events") setView("events");    // <-- wire Find Events
          }}
        />
      )}

      {view === "volunteer" && (
        <VolunteerCard width={360} height={560} onBack={() => setView("home")} />
      )}

      {view === "events" && (
        <SocialCard width={360} height={560} onBack={() => setView("home")} />
      )}
    </div>
  );
}