import React from "react";
import "./TextSwiper.css";   
import "./VolunteerCard.css";  
import crabPng from "./images/Crab-Feast-Haiti.png";
import collagePng from "./images/Collage-Craft-Club.png";
import playlistPng from "./images/Playlist-Set-Dance.jpg";
import karaokePng from "./images/Karaoke-Night.jpg";

const DEFAULT_EVENTS = [
  { id: "Social",     title: "Crab Feast for Haiti",        org: "High Hopes for Haiti", rating: 4, img: crabPng},
  { id: "Social",     title: "Collage Making",       org: "Charmers Club",      rating: 3, img: collagePng},
  { id: "Social",     title: "The Playlist Set",  org: "Mariska Moves",    rating: 4, img: playlistPng},
  {id: "Social", title: "Karaoke Night", org: "Max's Taphouse", rating: 5, img: karaokePng}
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
                    <div className="vol-logo-div" aria-hidden="true">
                      <img className="vol-logo" src={ev.img} alt="" width="300px" height="300px"/> 
                      {/* Picture not working for some reason */}
                      {/* {ev.org?.[0] ?? "V"} */}
                    </div>
                    <div className="vol-name">{ev.title}</div>
                    <div className="vol-meta">
                      <div className="vol-rating" aria-label={`${ev.rating} out of 5 stars`}>
                        {"★".repeat(ev.rating)}
                        {"☆".repeat(5 - ev.rating)}
                      </div>
                      <button className="signup-btn" onClick={() => signup(ev)}>                      Sign Up
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