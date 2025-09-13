import { useEffect, useState } from "react";
import Login from "./pages/Login";
import { apiGet } from "./api";

export default function App() {
  const [ready, setReady] = useState(false);
  const [health, setHealth] = useState("checking...");
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    apiGet("/api/health").then(d => setHealth(d.status)).finally(()=>setReady(true));
  }, []);

  if (!ready) return <p>Loading…</p>;
  if (!authed) return <Login onLogin={()=>setAuthed(true)} />;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Welcome</h1>
      <p><b>Health:</b> {health}</p>
      <p>You're logged in.</p>
      <button onClick={()=>{localStorage.removeItem("token"); window.location.reload();}}>Log out</button>
    </div>
  );
}