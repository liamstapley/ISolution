import "./AdditionalInfoCard.css";

export default function AdditionalInfoCard({
  width = 360,
  height = 560,
  onHome,
  onChoose,
}) {
  return (
    <div className="stage" style={{ width, height, "--duration": "0ms" }}>
      <div className="box">
        <div className="content">
          <div className="additional-page">
            <h1 className="additional-title">Additional Information</h1>
            <h2 className="additional-sub">Choose a section</h2>

            <div className="additional-buttons">
              <button
                className="btn-additional"
                onClick={() => onChoose?.("personality")}
              >
                Personality
              </button>
              <button
                className="btn-additional"
                onClick={() => onChoose?.("interests/causes")}
              >
                Interests/Causes
              </button>
              <button
                className="btn-additional"
                onClick={() => onChoose?.("location")}
              >
                Location
              </button>
            </div>

            <button onClick={onHome} className="additional-back">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}