import React, { useState } from "react";
import HomeCard from "./components/HomeCard";
import VolunteerCard from "./components/VolunteerCard";
import SocialCard from "./components/SocialCard";
import FriendsCard from "./components/FriendsCard";
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
            if (val === "events") setView("events");
            if (val === "friends") setView("friends");   // <— hook up Find Friends
            if (val === "careers") console.log("Careers coming soon");
          }}
        />
      )}

      {view === "volunteer" && (
        <VolunteerCard width={360} height={560} onBack={() => setView("home")} />
      )}

      {view === "events" && (
        <SocialCard width={360} height={560} onBack={() => setView("home")} />
      )}

      {view === "friends" && (
        <FriendsCard width={360} height={560} onBack={() => setView("home")} />
      )}
    </div>
  );
}