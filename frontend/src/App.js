import React, { useState } from "react";

import Login from "./components/Login";
import HomeCard from "./components/HomeCard";
import AdditionalInfoCard from "./components/AdditionalInfoCard";
import PersonalityQuiz from "./components/PersonalityQuiz";
import InterestsCausesQuiz from "./components/AdditionalInterestsQuiz"; // 👈 ADD THIS

import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";
import FriendsCard from "./components/FriendsCard";
import CareersCard from "./components/CareersCard";

import "./components/TextSwiper.css";

export default function App() {
  // If you’re using the login-first flow, start at "login"; otherwise "home".
  const [view, setView] = useState("home");
  const cardSize = { width: 360, height: 560 };

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", margin: 0 }}>
      {view === "home" && (
        <HomeCard
          {...cardSize}
          onChoose={(val) => {
            if (val === "volunteer") setView("volunteer");
            if (val === "events") setView("events");
            if (val === "friends") setView("friends");
            if (val === "careers") setView("careers");
            // Add an entry point to Additional Info wherever you prefer (e.g., a button on Home)
            if (val === "additional") setView("additional");
          }}
          onLearnMore={() => setView("additional")}
        />
      )}

      {view === "additional" && (
        <AdditionalInfoCard
          {...cardSize}
          onBack={() => setView("additional")}
          onHome={() => setView("home")}
          onChoose={(val) => {
            if (val === "personality") setView("personality");
            if (val === "interests/causes") setView("interests/causes"); // 👈 HANDLE IT
            if (val === "location") setView("location"); // (future)
          }}
        />
      )}

      {view === "personality" && (
        <PersonalityQuiz
          {...cardSize}
          onDone={() => setView("additional")} // after submit, go back to Additional Info
        />
      )}

      {view === "interests/causes" && ( // 👈 RENDER THE QUIZ
        <InterestsCausesQuiz
          {...cardSize}
          onDone={(answers) => {
            // save like your other quizzes
            console.log("Interests/Causes saved:", answers);
            // e.g., api.saveQuiz("interests_causes", answers);
            setView("additional"); // go back to Additional Info page
          }}
        />
      )}

      {view === "volunteer" && <VolunteerCard {...cardSize} onBack={() => setView("home")} />}
      {view === "events" && <SocialCard {...cardSize} onBack={() => setView("home")} />}
      {view === "friends" && <FriendsCard {...cardSize} onBack={() => setView("home")} />}
      {view === "careers" && <CareersCard {...cardSize} onBack={() => setView("home")} />}
    </div>
  );
}