import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { CrabGame } from "./components/CrabGame";
import { Leaderboard } from "./components/Leaderboard";
import "./styles.css";

function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await signIn("password", formData);
    } catch {
      setError(flow === "signIn" ? "Invalid credentials" : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="crab-logo">🦀</div>
        <h1 className="auth-title">Crabby Bird</h1>
        <p className="auth-subtitle">Swim through the coral reef!</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            name="email"
            placeholder="Email"
            type="email"
            required
            className="auth-input"
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            required
            className="auth-input"
          />
          <input name="flow" type="hidden" value={flow} />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button primary" disabled={loading}>
            {loading ? "..." : flow === "signIn" ? "Dive In" : "Join the Reef"}
          </button>

          <button
            type="button"
            className="auth-button secondary"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Create Account" : "Already have an account?"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="auth-button anonymous"
          onClick={() => signIn("anonymous")}
        >
          Continue as Guest 🐚
        </button>
      </div>

      <div className="bubbles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="bubble" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            width: `${10 + Math.random() * 20}px`,
            height: `${10 + Math.random() * 20}px`,
          }} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-crab">🦀</div>
        <p>Diving into the reef...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <div className="app-container">
      <header className="game-header">
        <h1 className="game-title">
          <span className="title-crab">🦀</span> Crabby Bird
        </h1>
        <div className="header-actions">
          <button
            className="header-button"
            onClick={() => setShowLeaderboard(!showLeaderboard)}
          >
            {showLeaderboard ? "🎮 Play" : "🏆 Scores"}
          </button>
          <button className="header-button signout" onClick={() => signOut()}>
            Exit Reef
          </button>
        </div>
      </header>

      <main className="game-main">
        {showLeaderboard ? (
          <Leaderboard onClose={() => setShowLeaderboard(false)} />
        ) : (
          <CrabGame onShowLeaderboard={() => setShowLeaderboard(true)} />
        )}
      </main>

      <footer className="app-footer">
        Requested by @0xPaulius · Built by @clonkbot
      </footer>
    </div>
  );
}

export default App;
