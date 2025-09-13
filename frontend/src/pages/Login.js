import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "register") {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }).then(r => { if (!r.ok) throw new Error("register"); return r.json(); });
      }
      const token = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      }).then(r => { if (!r.ok) throw new Error("login"); return r.json(); });

      localStorage.setItem("token", token.access_token);
      onLogin?.();
    } catch {
      setErr("Authentication failed");
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} style={{width:"100%",padding:8,margin:"8px 0"}} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:8,margin:"8px 0"}} />
        <button style={{width:"100%",padding:10}}>{mode === "login" ? "Login" : "Create account"}</button>
      </form>
      <button onClick={()=>setMode(mode==="login"?"register":"login")} style={{marginTop:12}}>
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </button>
      {err && <p style={{color:"crimson"}}>{err}</p>}
    </div>
  );
}