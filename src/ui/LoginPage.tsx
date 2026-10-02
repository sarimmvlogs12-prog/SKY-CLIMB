import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import loginBackground from "@/assets/sky-climb-login-background.webp.asset.json";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
}

function accountEmail(username: string) {
  return `${username}@skyclimb.local`;
}

export function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (!USERNAME_PATTERN.test(normalized)) {
      setMessage("Username must be 3–20 letters, numbers, or underscores.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({
          email: accountEmail(normalized),
          password,
          options: {
            data: {
              display_name: normalized,
              username_normalized: normalized,
            },
          },
        })
      : await supabase.auth.signInWithPassword({ email: accountEmail(normalized), password });
    setBusy(false);
    if (result.error) {
      const duplicate = result.error.message.toLowerCase().includes("already")
        || result.error.message.toLowerCase().includes("duplicate");
      setMessage(duplicate ? "That username is already taken." : result.error.message);
    }
  };

  return (
    <div className="relative flex h-[100dvh] items-center justify-center overflow-hidden p-4 sm:p-6">
      <img
        src={loginBackground.url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-[64%_center] sm:object-center"
      />
      <div className="absolute inset-0 bg-ink/20" />
      <div className="animate-pop-in relative z-10 w-full max-w-md game-panel bg-panel/92 p-5 backdrop-blur-sm sm:p-7">
        <div className="text-center">
          <h1 className="font-display text-5xl font-extrabold text-ink">DLICOM SKY <span className="text-energy-deep">CLIMB</span></h1>
          <p className="font-display font-bold text-ink-soft">Sign in. Pick your climber. Race to the summit.</p>
        </div>
        <form className="mt-5 grid gap-3" onSubmit={submit}>
          <input
            aria-label="Username"
            required
            minLength={3}
            maxLength={20}
            autoCapitalize="none"
            autoComplete="username"
            spellCheck={false}
            value={username}
            onChange={(event) => setUsername(normalizeUsername(event.target.value))}
            placeholder="Username"
            className="rounded-xl border-[3px] border-ink bg-sky-low/60 px-3 py-3 font-bold text-ink outline-none"
          />
          <input aria-label="Password" required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="rounded-xl border-[3px] border-ink bg-sky-low/60 px-3 py-3 font-bold text-ink outline-none" />
          {mode === "signup" && <p className="px-1 text-xs font-bold text-ink-soft">Use 3–20 letters, numbers, or underscores. No email needed.</p>}
          {message && <p role="status" className="rounded-lg bg-sky-low p-2 text-sm font-bold text-ink">{message}</p>}
          <button disabled={busy} className="btn-pop bg-flag px-5 py-3 text-lg text-ink">{busy ? "PLEASE WAIT…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}</button>
        </form>
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} className="mt-4 w-full font-display font-bold text-ink underline decoration-2 underline-offset-4">
          {mode === "signin" ? "New climber? Create account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}