import React, { useEffect, useRef, useState } from 'react';

function AirplaneGame() {
  const canvasRef = useRef(null);
  const plane = useRef({ x: 80, y: 150, velocity: 0 });
  const gravity = 0.15;
  const lift = -4.2;
  const mountainWidth = 60;
  const gapSize = 160;
  const mountains = useRef([]);
  const score = useRef(0);
  const [gameState, setGameState] = useState('start');
  const [countdown, setCountdown] = useState(3);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("airplaneHighScore") || 0));

  const resetGame = () => {
    plane.current = { x: 80, y: 150, velocity: 0 };
    mountains.current = [{ x: 400, gapY: 130 }];
    score.current = 0;
    setCountdown(3);
    setGameState('countdown');
    startCountdown();
  };

  const startCountdown = () => {
    let count = 3;
    const interval = setInterval(() => {
      setCountdown(count);
      count--;
      if (count < 0) {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 700);
  };

  const checkCollision = () => {
    return mountains.current.some(mountain => {
      const withinX = plane.current.x + 20 > mountain.x && plane.current.x - 20 < mountain.x + mountainWidth;
      const outsideGap = plane.current.y < mountain.gapY - gapSize / 2 || plane.current.y > mountain.gapY + gapSize / 2;
      return withinX && outsideGap;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frameId;

    const draw = () => {
      // Background
      ctx.fillStyle = '#aee0f7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mountains
      if (gameState === 'playing') {
        plane.current.velocity += gravity;
        plane.current.y += plane.current.velocity;
      }

      // Draw airplane (red triangle)
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(plane.current.x, plane.current.y);
      ctx.lineTo(plane.current.x - 20, plane.current.y + 10);
      ctx.lineTo(plane.current.x - 20, plane.current.y - 10);
      ctx.closePath();
      ctx.fill();

      // Draw mountains
      ctx.fillStyle = '#556b2f';
      mountains.current.forEach(mountain => {
        mountain.x -= 2;
        // Draw top mountain
        ctx.beginPath();
        ctx.moveTo(mountain.x, mountain.gapY - gapSize / 2);
        ctx.lineTo(mountain.x + mountainWidth / 2, mountain.gapY - gapSize / 2 - 100);
        ctx.lineTo(mountain.x + mountainWidth, mountain.gapY - gapSize / 2);
        ctx.fill();

        // Draw bottom mountain
        ctx.beginPath();
        ctx.moveTo(mountain.x, mountain.gapY + gapSize / 2);
        ctx.lineTo(mountain.x + mountainWidth / 2, mountain.gapY + gapSize / 2 + 100);
        ctx.lineTo(mountain.x + mountainWidth, mountain.gapY + gapSize / 2);
        ctx.fill();

        if (!mountain.passed && mountain.x + mountainWidth < plane.current.x) {
          mountain.passed = true;
          score.current++;
        }
      });

      if (mountains.current[mountains.current.length - 1].x < 250) {
        mountains.current.push({
          x: canvas.width,
          gapY: Math.random() * 150 + 75,
          passed: false,
        });
      }

      mountains.current = mountains.current.filter(m => m.x + mountainWidth > 0);

      // Score
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText(`Score: ${score.current}`, 10, 20);
      ctx.fillText(`High Score: ${highScore}`, 10, 40);

      // Collision
      if (checkCollision()) {
        if (gameState === 'playing') {
          setGameState('gameover');
          if (score.current > highScore) {
            localStorage.setItem('airplaneHighScore', score.current);
            setHighScore(score.current);
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    if (gameState === 'playing' || gameState === 'gameover') draw();
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  const handleClick = () => {
    if (gameState === 'start') {
      resetGame();
    } else if (gameState === 'playing') {
      plane.current.velocity = lift;
    } else if (gameState === 'gameover') {
      setGameState('start');
    }
  };

  return (
    <div>
      <h3>🛩️ Airplane Game – Click to fly. Avoid mountains!</h3>
      {gameState === 'start' && <p>Click to Start</p>}
      {gameState === 'countdown' && <p>Get Ready... {countdown}</p>}
      {gameState === 'gameover' && <p>💀 Game Over – Score: {score.current} – Click to restart</p>}
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{ border: '2px solid #000', backgroundColor: '#aee0f7' }}
        onClick={handleClick}
      />
    </div>
  );
}

export default AirplaneGame;
