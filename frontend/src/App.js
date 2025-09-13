import React, { useState } from "react";

import HomeCard from "./components/HomeCard";
import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";
import FriendsCard from "./components/FriendsCard";
import CareersCard from "./components/CareersCard";

import "./components/TextSwiper.css"; // shared card styles (.stage, .box, .content)

export default function App() {
  const [view, setView] = useState("home");

  // Keep dimensions consistent across pages
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