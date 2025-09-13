import React from "react";
import "./TextSwiper.css";  // reuse .stage, .box, .content styles from your swiper
import "./HomeCard.css";

export default function HomeCard({
  width = 360,
  height = 560,
  onChoose, // (value) => void
}) {
  const stageStyle = { width, height };

  const pick = (val) => {
    if (onChoose) onChoose(val);
  };

  return (
    <div className="home-root">
      <div className="stage" style={stageStyle}>
        <div className="box">
          <div className="content">
            <div className="home-page">
              <h1 className="home-title">
                Welcome to <span className="brand">ISolution</span>
              </h1>

              <h2 className="home-sub">Why are you here?</h2>

              <div className="home-buttons" role="list">
                <button className="btn-home" onClick={() => pick("volunteer")} role="listitem">
                  Volunteer
                </button>
                <button className="btn-home" onClick={() => pick("events")} role="listitem">
                  Find Events
                </button>
                <button className="btn-home" onClick={() => pick("friends")} role="listitem">
                  Find Friends
                </button>
                <button className="btn-home" onClick={() => pick("careers")} role="listitem">
                  Find Careers
                </button>
              </div>

              <div className="home-hint">Let us learn more</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}