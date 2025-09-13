import React from "react";
import "./TextSwiper.css";   // reuses .stage, .box, .content styles
import "./VolunteerCard.css";

const DEFAULT_ACTIVITIES = [
  { id: "trash",     title: "Trash Clean-Up",               org: "City Services", rating: 4 },
  { id: "recycling", title: "Recycling Info Session",       org: "GreenHub",      rating: 3 },
  { id: "shelter",   title: "Animal Shelter Volunteering",  org: "Happy Paws",    rating: 4 },
];

export default function VolunteerCard({
  width = 360,
  height = 560,
  activities = DEFAULT_ACTIVITIES,
  onBack,
}) {
  const stageStyle = { width, height };

  const signup = (a) => {
    console.log(`${a.title}`);
  };

  return (
    <div className="vol-root">
      <div className="stage" style={stageStyle}>
        <div className="box">
          <div className="content">
            <div className="vol-page">
              <header className="vol-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
                <h2 className="vol-title">Volunteer Opportunities</h2>
                <div className="spacer" />
              </header>

              <ul className="vol-list">
                {activities.map((a) => (
                  <li key={a.id} className="vol-card">
                    <div className="vol-logo" aria-hidden="true">
                      {a.org?.[0] ?? "V"}
                    </div>
                    <div className="vol-meta">
                      <div className="vol-name">{a.title}</div>
                      <div className="vol-rating" aria-label={`${a.rating} out of 5 stars`}>
                        {"★".repeat(a.rating)}
                        {"☆".repeat(5 - a.rating)}
                      </div>
                    </div>
                    <button className="signup-btn" onClick={() => signup(a)}>
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
