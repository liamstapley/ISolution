import { useEffect, useState } from "react";
import { apiGet } from "./api";

function App() {
  const [health, setHealth] = useState("checking...");
  const [msg, setMsg] = useState("...");

  useEffect(() => {
    apiGet("/api/health")
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("error"));

    apiGet("/api/hello?name=Liam")
      .then((d) => setMsg(d.message))
      .catch(() => setMsg("error"));
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>React + FastAPI</h1>
      <p><b>Health:</b> {health}</p>
      <p><b>Hello:</b> {msg}</p>
    </div>
  );
}

export default App;