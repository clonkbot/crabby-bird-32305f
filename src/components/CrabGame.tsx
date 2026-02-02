import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

interface CrabGameProps {
  onShowLeaderboard: () => void;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const CRAB_SIZE = 40;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -9;
const PIPE_SPEED = 3;

export function CrabGame({ onShowLeaderboard }: CrabGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitScore = useMutation(api.scores.submit);

  const crabY = useRef(GAME_HEIGHT / 2);
  const crabVelocity = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);

  const resetGame = useCallback(() => {
    crabY.current = GAME_HEIGHT / 2;
    crabVelocity.current = 0;
    pipes.current = [];
    scoreRef.current = 0;
    setScore(0);
    setSubmitted(false);
  }, []);

  const jump = useCallback(() => {
    if (gameState === "idle") {
      resetGame();
      setGameState("playing");
    }
    if (gameState === "playing") {
      crabVelocity.current = JUMP_STRENGTH;
    }
  }, [gameState, resetGame]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  }, [jump]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCrab = (y: number) => {
      const x = 80;
      const bobOffset = Math.sin(Date.now() / 150) * 3;

      // Body
      ctx.fillStyle = "#FF6B4A";
      ctx.beginPath();
      ctx.ellipse(x, y + bobOffset, CRAB_SIZE / 2, CRAB_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shell pattern
      ctx.fillStyle = "#E85A3A";
      ctx.beginPath();
      ctx.ellipse(x, y + bobOffset - 3, CRAB_SIZE / 3, CRAB_SIZE / 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(x - 10, y + bobOffset - 12, 8, 0, Math.PI * 2);
      ctx.arc(x + 10, y + bobOffset - 12, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1A1A2E";
      ctx.beginPath();
      ctx.arc(x - 8, y + bobOffset - 12, 4, 0, Math.PI * 2);
      ctx.arc(x + 12, y + bobOffset - 12, 4, 0, Math.PI * 2);
      ctx.fill();

      // Claws
      ctx.fillStyle = "#FF8866";
      const clawAnim = Math.sin(Date.now() / 200) * 5;
      ctx.beginPath();
      ctx.ellipse(x - 28, y + bobOffset + 5 + clawAnim, 12, 8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 28, y + bobOffset + 5 - clawAnim, 12, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = "#FF6B4A";
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const legAnim = Math.sin(Date.now() / 100 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(x - 15, y + bobOffset + 8);
        ctx.lineTo(x - 25 - i * 3, y + bobOffset + 18 + legAnim);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 15, y + bobOffset + 8);
        ctx.lineTo(x + 25 + i * 3, y + bobOffset + 18 - legAnim);
        ctx.stroke();
      }
    };

    const drawPipe = (pipe: Pipe) => {
      // Coral pipes
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      gradient.addColorStop(0, "#FF6B8A");
      gradient.addColorStop(0.5, "#FF8FAA");
      gradient.addColorStop(1, "#FF6B8A");

      // Top pipe (coral)
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP / 2, [0, 0, 15, 15]);
      ctx.fill();

      // Coral details on top
      ctx.fillStyle = "#FF4D6A";
      for (let i = 0; i < 3; i++) {
        const bx = pipe.x + 10 + i * 15;
        const by = pipe.gapY - PIPE_GAP / 2 - 10;
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bottom pipe (coral)
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(pipe.x, pipe.gapY + PIPE_GAP / 2, PIPE_WIDTH, GAME_HEIGHT - (pipe.gapY + PIPE_GAP / 2), [15, 15, 0, 0]);
      ctx.fill();

      // Coral details on bottom
      ctx.fillStyle = "#FF4D6A";
      for (let i = 0; i < 3; i++) {
        const bx = pipe.x + 10 + i * 15;
        const by = pipe.gapY + PIPE_GAP / 2 + 10;
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawBackground = () => {
      // Ocean gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, "#0A1628");
      gradient.addColorStop(0.3, "#0D2137");
      gradient.addColorStop(0.7, "#0F2847");
      gradient.addColorStop(1, "#1A3A5C");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Caustic light rays
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 5; i++) {
        const x = ((Date.now() / 50 + i * 80) % (GAME_WIDTH + 100)) - 50;
        ctx.fillStyle = "#4AC8FF";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 30, 0);
        ctx.lineTo(x + 80, GAME_HEIGHT);
        ctx.lineTo(x + 50, GAME_HEIGHT);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Seaweed
      ctx.strokeStyle = "#1E5631";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const x = i * 55 + 20;
        const wave = Math.sin(Date.now() / 500 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(x, GAME_HEIGHT);
        ctx.quadraticCurveTo(x + wave, GAME_HEIGHT - 60, x + wave * 0.5, GAME_HEIGHT - 100 - (i % 3) * 20);
        ctx.stroke();
      }

      // Bubbles
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      for (let i = 0; i < 20; i++) {
        const bx = (i * 73 + Date.now() / 20) % GAME_WIDTH;
        const by = GAME_HEIGHT - ((Date.now() / 10 + i * 50) % GAME_HEIGHT);
        const size = 3 + (i % 4) * 2;
        ctx.beginPath();
        ctx.arc(bx, by, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sandy floor
      const sandGradient = ctx.createLinearGradient(0, GAME_HEIGHT - 40, 0, GAME_HEIGHT);
      sandGradient.addColorStop(0, "rgba(194, 178, 128, 0)");
      sandGradient.addColorStop(1, "rgba(194, 178, 128, 0.3)");
      ctx.fillStyle = sandGradient;
      ctx.fillRect(0, GAME_HEIGHT - 40, GAME_WIDTH, 40);
    };

    const drawScore = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 48px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.fillText(scoreRef.current.toString(), GAME_WIDTH / 2, 70);
      ctx.shadowBlur = 0;
    };

    const gameLoop = () => {
      drawBackground();

      if (gameState === "playing") {
        // Update crab
        crabVelocity.current += GRAVITY;
        crabY.current += crabVelocity.current;

        // Spawn pipes
        if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < GAME_WIDTH - 200) {
          pipes.current.push({
            x: GAME_WIDTH,
            gapY: 150 + Math.random() * (GAME_HEIGHT - 300),
            passed: false,
          });
        }

        // Update pipes
        pipes.current = pipes.current.filter((pipe) => pipe.x > -PIPE_WIDTH);
        pipes.current.forEach((pipe) => {
          pipe.x -= PIPE_SPEED;

          // Score
          if (!pipe.passed && pipe.x + PIPE_WIDTH < 80) {
            pipe.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        });

        // Collision detection
        const crabBox = {
          x: 60,
          y: crabY.current - CRAB_SIZE / 2.5,
          width: CRAB_SIZE - 10,
          height: CRAB_SIZE / 1.5,
        };

        // Floor/ceiling
        if (crabY.current < 20 || crabY.current > GAME_HEIGHT - 20) {
          setGameState("gameover");
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
          }
        }

        // Pipe collision
        for (const pipe of pipes.current) {
          if (
            crabBox.x + crabBox.width > pipe.x &&
            crabBox.x < pipe.x + PIPE_WIDTH
          ) {
            if (
              crabBox.y < pipe.gapY - PIPE_GAP / 2 ||
              crabBox.y + crabBox.height > pipe.gapY + PIPE_GAP / 2
            ) {
              setGameState("gameover");
              if (scoreRef.current > highScore) {
                setHighScore(scoreRef.current);
              }
            }
          }
        }
      }

      // Draw pipes
      pipes.current.forEach(drawPipe);

      // Draw crab
      drawCrab(crabY.current);

      // Draw score
      if (gameState === "playing") {
        drawScore();
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, highScore]);

  const handleSubmitScore = async () => {
    if (!playerName.trim() || submitted || submitting) return;
    setSubmitting(true);
    try {
      await submitScore({ score, playerName: playerName.trim() });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit score:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="game-container">
      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={jump}
          className="game-canvas"
        />

        {gameState === "idle" && (
          <div className="game-overlay">
            <div className="overlay-content">
              <div className="big-crab">🦀</div>
              <h2>Crabby Bird</h2>
              <p>Click or press SPACE to swim!</p>
              <p className="hint">Avoid the coral reefs</p>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="game-overlay gameover">
            <div className="overlay-content">
              <h2>Game Over!</h2>
              <div className="final-score">
                <span className="score-label">Score</span>
                <span className="score-value">{score}</span>
              </div>
              {score > 0 && !submitted && (
                <div className="submit-section">
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="name-input"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSubmitScore}
                    disabled={!playerName.trim() || submitting}
                    className="submit-button"
                  >
                    {submitting ? "Sharing..." : "Share Score 🏆"}
                  </button>
                </div>
              )}
              {submitted && (
                <p className="submitted-message">Score shared! 🎉</p>
              )}
              <div className="gameover-actions">
                <button onClick={() => { resetGame(); setGameState("idle"); }} className="play-again-button">
                  Play Again
                </button>
                <button onClick={onShowLeaderboard} className="leaderboard-button">
                  View Leaderboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="game-instructions">
        <p>🖱️ Click or press SPACE to swim up</p>
        <p>🪸 Avoid the coral!</p>
        {highScore > 0 && <p className="high-score">🏆 Best: {highScore}</p>}
      </div>
    </div>
  );
}
