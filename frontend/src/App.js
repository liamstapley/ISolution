import React, { useState } from "react";

import Login from "./components/Login";
import HomeCard from "./components/HomeCard";
import AdditionalInfoCard from "./components/AdditionalInfoCard";
import PersonalityQuiz from "./components/PersonalityQuiz";
import InterestsCausesQuiz from "./components/AdditionalInterestsQuiz";

import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";
import FriendsCard from "./components/FriendsCard";
import CareersCard from "./components/CareersCard";

import "./components/TextSwiper.css";

export default function App() {
  // Start at the login screen
  const [view, setView] = useState("login");
  const cardSize = { width: 360, height: 560 };

  // If you want to auto-skip login when a token exists, uncomment:
  // useEffect(() => {
  //   if (localStorage.getItem("token")) setView("home");
  // }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", margin: 0 }}>
      {/* LOGIN */}
      {view === "login" && (
        <Login
          onLogin={({ registered }) => {
            // If they just registered -> go to intro survey
            // If they just logged in -> go to home
            setView(registered ? "personality_intro" : "home");
          }}
        />
      )}

      {/* HOME */}
      {view === "home" && (
        <HomeCard
          {...cardSize}
          onChoose={(val) => {
            if (val === "volunteer") setView("volunteer");
            if (val === "events") setView("events");
            if (val === "friends") setView("friends");
            if (val === "careers") setView("careers");
            if (val === "additional") setView("additional");
          }}
          onLearnMore={() => setView("additional")}
        />
      )}

      {/* ADDITIONAL INFO HUB */}
      {view === "additional" && (
        <AdditionalInfoCard
          {...cardSize}
          onHome={() => setView("home")}  // back to home
          onBack={() => setView("additional")}  // back to additional
          onChoose={(val) => {
            if (val === "personality") setView("personality");
            if (val === "interests/causes") setView("interests/causes");
            if (val === "location") setView("location"); // (future)
          }}
        />
      )}

      {/* INTRO SURVEY (after register) */}
      {view === "personality_intro" && (
        <PersonalityQuiz
          {...cardSize}
          onDone={() => setView("home")} // after intro survey, go to home
        />
      )}

      {/* PERSONALITY from Additional Info */}
      {view === "personality" && (
        <PersonalityQuiz
          {...cardSize}
          onDone={() => setView("additional")} // after submit, back to Additional Info
        />
      )}

      {/* INTERESTS / CAUSES QUIZ */}
      {view === "interests/causes" && (
        <InterestsCausesQuiz
          {...cardSize}
          onDone={(answers) => {
            console.log("Interests/Causes saved:", answers);
            // e.g., api.saveQuiz("interests_causes", answers);
            setView("additional"); // back to Additional Info page
          }}
        />
      )}

      {/* OTHER CARDS */}
      {view === "volunteer" && <VolunteerCard {...cardSize} onBack={() => setView("home")} />}
      {view === "events" && <SocialCard {...cardSize} onBack={() => setView("home")} />}
      {view === "friends" && <FriendsCard {...cardSize} onBack={() => setView("home")} />}
      {view === "careers" && <CareersCard {...cardSize} onBack={() => setView("home")} />}
    </div>
  );
}