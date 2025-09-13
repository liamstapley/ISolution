import React from "react";
import "./TextSwiper.css";  // reuse .stage, .box, .content styles
import "./HomeCard.css";

export default function HomeCard({
  width = 360,
  height = 560,
  onChoose,     // (value) => void
  onLearnMore,  // ✅ new prop for the "learn more" link
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

              {/* ✅ clickable learn more */}
              <div className="home-hint">
                Let us{" "}
                <button
                  type="button"
                  className="home-link"
                  onClick={onLearnMore}
                >
                  learn more
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}