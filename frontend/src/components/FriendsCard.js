import React from "react";
import "./TextSwiper.css";  // reuses .stage, .box, .content (card look)
import "./VolunteerCard.css";   // reuses list/card styles

const DEFAULT_FRIENDS = [
  { id: "liam",   title: "Liam Stapley",     org: "PFP", rating: 5 },
  { id: "frank",  title: "Frank Murphy",     org: "PFP", rating: 4 },
  { id: "jonathan", title: "Jonathan Perry", org: "PFP", rating: 4 },
];

export default function FriendsCard({
  width = 360,
  height = 560,
  people = DEFAULT_FRIENDS,
  onBack,
}) {
  const stageStyle = { width, height };

  const connect = (p) => {
    console.log(`Connect: ${p.title}`);
  };

  return (
    <div className="vol-root">
      <div className="stage" style={stageStyle}>
        <div className="box">
          <div className="content">
            <div className="vol-page">
              <header className="vol-header">
                <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
                <h2 className="vol-title">Find Friends</h2>
                <div className="spacer" />
              </header>

               <ul className="vol-list">
                {people.map((p) => (
                  <li key={p.id} className="vol-card">
                    <div className="vol-logo-div" aria-hidden="true">
                      <img className="vol-logo" src={p.img} alt="" width="300px" height="300px"/> 
                      {/* Picture not working for some reason */}
                      {/* {a.org?.[0] ?? "V"} */}
                    </div>
                    <div className="vol-name">{p.title}</div>
                    <div className="vol-meta">
                      <div className="vol-rating" aria-label={`${p.rating} out of 5 stars`}>
                        {"★".repeat(p.rating)}
                        {"☆".repeat(5 - p.rating)}
                      </div>
                      <button className="signup-btn" onClick={() => connect(p)}>Connect</button>

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