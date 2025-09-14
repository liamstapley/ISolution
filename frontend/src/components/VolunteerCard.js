import React from "react";
import "./TextSwiper.css";   // reuses .stage, .box, .content styles
import "./VolunteerCard.css";
import AnimalPng from "./images/Baltimore-Animal-Services.jpeg"
import HomePng from "./images/Elevated-Home.png"
import VanqPng from "./images/Vanquish-Litterzilla-Clean.png"

const DEFAULT_ACTIVITIES = [
  { id: "Volunteer",     title: "Dog Walker",        org: "Baltimore County Animal Services", rating: 4, img: AnimalPng },
  { id: "Volunteer",     title: "Cat Caretaker",       org: "Baltimore County Animal Services",      rating: 3, img: AnimalPng },
  { id: "Volunteer",     title: "Building and Repairing Homes",  org: "Adopt A Home",    rating: 4, img: HomePng },
  {id: "Volunteer",     title: "Neighborhood Cleanup",       org: "Clean Green Baltimore County",      rating: 5, img: VanqPng },
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
                    <div className="vol-logo-div" aria-hidden="true">
                      <img className="vol-logo" src={a.img} alt="" width="300px" height="300px"/> 
                      {/* Picture not working for some reason */}
                      {/* {a.org?.[0] ?? "V"} */}
                    </div>
                    <div className="vol-name">{a.title}</div>
                    <div className="vol-meta">
                      <div className="vol-rating" aria-label={`${a.rating} out of 5 stars`}>
                        {"★".repeat(a.rating)}
                        {"☆".repeat(5 - a.rating)}
                      </div>
                      <button className="signup-btn" onClick={() => signup(a)}>                      Sign Up
                      </button>

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
