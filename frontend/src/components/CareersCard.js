import React from "react";
import "./TextSwiper.css";  // .stage, .box, .content
import "./VolunteerCard.css";   // reuse list/card styles

const DEFAULT_CAREERS = [
  { id: "career-fair", title: "Climate Career Fair",    org: "UD Careers", rating: 5 },
  { id: "hop-hacks",   title: "HopHacks Hackathon",     org: "Hopkins",    rating: 4 },
  { id: "mock-int",    title: "Mock Interview",         org: "Career Ctr", rating: 4 },
];

export default function CareersCard({
  width = 360,
  height = 560,
  items = DEFAULT_CAREERS,
  onBack,
}) {
  const stageStyle = { width, height };

  const apply = (it) => {
    console.log(`Apply: ${it.title}`);
  };

  return (
    <div className="vol-root">
      <div className="stage" style={stageStyle}>
        <div className="box">
          <div className="content">
            <div className="vol-page">
              <header className="vol-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
                <h2 className="vol-title">Career Opportunities</h2>
                <div className="spacer" />
              </header>

              <ul className="vol-list">
                {items.map((it) => (
                  <li key={it.id} className="vol-card">
                    <div className="vol-logo-div" aria-hidden="true">
                      <img className="vol-logo" src="sample-logo.png" alt="" width="300px" height="300px"/> 
                      {/* Picture not working for some reason */}
                      {/* {a.org?.[0] ?? "V"} */}
                    </div>
                    <div className="vol-name">{it.title}</div>
                    <div className="vol-meta">
                      <div className="vol-rating" aria-label={`${it.rating} out of 5 stars`}>
                        {"★".repeat(it.rating)}
                        {"☆".repeat(5 - it.rating)}
                      </div>
                      <button className="signup-btn" onClick={() => apply(it)}>Sign Up</button>

                    </div>

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