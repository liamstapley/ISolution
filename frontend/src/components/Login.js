import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      if (mode === "register") {
        if (!password || password.length < 6) {
          setErr("Password must be at least 6 characters.");
          return;
        }
        if (password !== confirm) {
          setErr("Passwords do not match.");
          return;
        }
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
    <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: 12 }}>
        {mode === "login" ? "Login" : "Register"}
      </h2>

      <form onSubmit={submit}>
        <label style={{ display: "block", marginBottom: 6 }}>Username</label>
        <input
          placeholder="username"
          value={username}
          onChange={e=>setUsername(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:12}}
          autoComplete="username"
          required
        />

        <label style={{ display: "block", marginBottom: 6 }}>Password</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            type={showPw ? "text" : "password"}
            placeholder="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={{flex:1,padding:10}}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          <button
            type="button"
            onClick={()=>setShowPw(s=>!s)}
            style={{padding:"0 12px"}}
            aria-label={showPw ? "Hide password" : "Show password"}
            title={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {mode === "register" && (
          <>
            <label style={{ display: "block", marginBottom: 6 }}>Confirm password</label>
            <input
              type={showPw ? "text" : "password"}
              placeholder="confirm password"
              value={confirm}
              onChange={e=>setConfirm(e.target.value)}
              style={{width:"100%",padding:10,marginBottom:12}}
              autoComplete="new-password"
              required
            />
          </>
        )}

        <button style={{width:"100%",padding:12}}>
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>

      <button
        onClick={()=>{ setMode(m => m==="login" ? "register" : "login"); setErr(""); }}
        style={{marginTop:12}}
      >
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </button>

      {err && <p style={{color:"crimson",marginTop:10}}>{err}</p>}
    </div>
  );
}