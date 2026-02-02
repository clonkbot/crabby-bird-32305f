import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

interface LeaderboardProps {
  onClose: () => void;
}

export function Leaderboard({ onClose }: LeaderboardProps) {
  const scores = useQuery(api.scores.getTopScores, { limit: 15 });
  const userBest = useQuery(api.scores.getUserBest);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-card">
        <div className="leaderboard-header">
          <h2>🏆 Ocean Champions</h2>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        {userBest && (
          <div className="your-best">
            <span className="your-best-label">Your Best</span>
            <span className="your-best-score">{userBest.score}</span>
          </div>
        )}

        <div className="leaderboard-list">
          {scores === undefined ? (
            <div className="loading-scores">
              <div className="loading-bubble"></div>
              <p>Loading scores...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="no-scores">
              <p>🦀</p>
              <p>No scores yet!</p>
              <p>Be the first to conquer the reef!</p>
            </div>
          ) : (
            scores.map((entry: Doc<"scores">, index: number) => (
              <div
                key={entry._id}
                className={`leaderboard-entry ${index < 3 ? `top-${index + 1}` : ""}`}
              >
                <div className="entry-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && <span className="rank-number">{index + 1}</span>}
                </div>
                <div className="entry-info">
                  <span className="entry-name">{entry.playerName}</span>
                  <span className="entry-date">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="entry-score">{entry.score}</div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="back-to-game">
          🎮 Back to Game
        </button>
      </div>

      <div className="underwater-decorations">
        <div className="seaweed left"></div>
        <div className="seaweed right"></div>
        <div className="fish fish-1">🐠</div>
        <div className="fish fish-2">🐡</div>
        <div className="fish fish-3">🐟</div>
      </div>
    </div>
  );
}
