import React from "react";
import "./TextSwiper.css";   
import "./VolunteerCard.css";  

const DEFAULT_EVENTS = [
  { id: "game-night", title: "Game Night",                         org: "Community Center", rating: 5 },
  { id: "climate-meet", title: "College Students for Climate — Meeting", org: "Climate Action Club", rating: 4 },
  { id: "dog-meetup", title: "Dog Owner's Meetup",                 org: "City Parks",        rating: 4 },
];

export default function SocialCard({
  width = 360,
  height = 560,
  events = DEFAULT_EVENTS,
  onBack,
}) {
  const stageStyle = { width, height };

  const signup = (e) => {
    console.log(`Sign Up: ${e.title}`);
  };

  return (
    <div className="vol-root">
      <div className="stage" style={stageStyle}>
        <div className="box">
          <div className="content">
            <div className="vol-page">
              <header className="vol-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
                <h2 className="vol-title">Social Opportunities</h2>
                <div className="spacer" />
              </header>

              <ul className="vol-list">
                {events.map((ev) => (
                  <li key={ev.id} className="vol-card">
                    <div className="vol-logo" aria-hidden="true">
                      {ev.org?.[0] ?? "E"}
                    </div>
                    <div className="vol-meta">
                      <div className="vol-name">{ev.title}</div>
                      <div className="vol-rating" aria-label={`${ev.rating} out of 5 stars`}>
                        {"★".repeat(ev.rating)}
                        {"☆".repeat(5 - ev.rating)}
                      </div>
                    </div>
                    <button className="signup-btn" onClick={() => signup(ev)}>
                      Sign Up
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}