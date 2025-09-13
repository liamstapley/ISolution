import React, { useState } from "react";

import Login from "./components/Login";         // the themed card version
import HomeCard from "./components/HomeCard";
import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";
import FriendsCard from "./components/FriendsCard";
import CareersCard from "./components/CareersCard";
import QuizSwiper from "./components/QuizSwiper"; // your survey

import "./components/TextSwiper.css"; // provides .stage, .box, .content (card look)

export default function App() {
  // Always start at login
  const [view, setView] = useState("login");

  // Keep rectangle size consistent across screens
  const cardSize = { width: 360, height: 560 };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        margin: 0,
      }}
    >
      {view === "login" && (
        <Login
          {...cardSize}
          onLogin={({ registered } = {}) => {
            setView(registered ? "survey" : "home");
          }}
        />
      )}

      {view === "survey" && (
        <QuizSwiper
          {...cardSize}
          // After survey is done, send user to Home
          onSubmit={() => setView("home")}
        />
      )}

      {view === "home" && (
        <HomeCard
          {...cardSize}
          onChoose={(val) => {
            if (val === "volunteer") setView("volunteer");
            if (val === "events") setView("events");
            if (val === "friends") setView("friends");
            if (val === "careers") setView("careers");
          }}
        />
      )}

      {view === "volunteer" && (
        <VolunteerCard {...cardSize} onBack={() => setView("home")} />
      )}

      {view === "events" && (
        <SocialCard {...cardSize} onBack={() => setView("home")} />
      )}

      {view === "friends" && (
        <FriendsCard {...cardSize} onBack={() => setView("home")} />
      )}

      {view === "careers" && (
        <CareersCard {...cardSize} onBack={() => setView("home")} />
      )}
    </div>
  );
}