import React, { useEffect, useRef, useState } from 'react';

function FishGame() {
  const canvasRef = useRef(null);
  const fish = useRef({ x: 80, y: 150, velocity: 0 });
  const gravity = 0.15;
  const jumpForce = -4.2;
 const gapSize = 240;     // Wider gap for easier play (was 200)
const pipeWidth = 40;    // Narrower pipe (was 50)
  const pipes = useRef([]);
  const coins = useRef([]);
  const splashes = useRef([]);
  const pipeTimer = useRef(0);

  const [gameState, setGameState] = useState('start');
  const score = useRef(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("highScore") || 0));
  const [countdown, setCountdown] = useState(3);

  const jumpSound = useRef(null);
  const hitSound = useRef(null);
  const nemoImg = useRef(new Image());

  useEffect(() => {
    nemoImg.current.src = '/nemo.png';
  }, []);

  const resetGame = () => {
    fish.current = { x: 80, y: 150, velocity: 0 };
    pipes.current = [];
    coins.current = [];
    score.current = 0;
    pipeTimer.current = 0;
    setCountdown(3);
    setGameState('countdown');
    countdownStart();
  };

  const countdownStart = () => {
    let count = 3;
    const interval = setInterval(() => {
      setCountdown(count);
      count--;
      if (count < 0) {
        clearInterval(interval);
        setGameState('playing');
      }
    }, 300);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let gameRunning = true;
    let lastPipeTime = Date.now();

    const draw = () => {
      if (!gameRunning) return;

      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a0e9f7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gravity
      if (gameState === 'playing') {
        fish.current.velocity += gravity;
        fish.current.y += fish.current.velocity;
      }

      // 🐟 Fish
      if (nemoImg.current.complete) {
        ctx.drawImage(nemoImg.current, fish.current.x - 25, fish.current.y - 25, 50, 50);
      } else {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.ellipse(fish.current.x, fish.current.y, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 💦 Splash
      splashes.current.forEach((splash, i) => {
        const age = Date.now() - splash.created;
        if (age > 400) {
          splashes.current.splice(i, 1);
          return;
        }
        splash.radius += 0.7;
        splash.opacity -= 0.02;
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 150, 255, ${splash.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 🌿 Pipes
      ctx.fillStyle = 'green';
      pipes.current.forEach(pipe => {
        pipe.x -= 2;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY - gapSize / 2);
        ctx.fillRect(pipe.x, pipe.gapY + gapSize / 2, pipeWidth, canvas.height - pipe.gapY);

        if (!pipe.passed && pipe.x + pipeWidth < fish.current.x) {
          score.current += 1;
          pipe.passed = true;
        }
      });

      // 🕒 Spawn new pipe every 1200ms
      if (gameState === 'playing' && now - lastPipeTime > 1200) {
        const gapY = Math.random() * 150 + 75;
        pipes.current.push({ x: canvas.width, gapY, passed: false });

        // 🪙 Coin inside pipe gap
        coins.current.push({
          x: canvas.width + pipeWidth / 2,
          y: gapY,
          radius: 8,
          pulse: 0,
          direction: 1,
        });

        lastPipeTime = now;
      }

      pipes.current = pipes.current.filter(pipe => pipe.x + pipeWidth > 0);

      // 🪙 Draw coins
      coins.current.forEach((coin, i) => {
        coin.x -= 2;
        coin.pulse += 0.1 * coin.direction;
        if (coin.pulse > 1 || coin.pulse < -1) coin.direction *= -1;

        const animatedRadius = coin.radius + coin.pulse;

        const gradient = ctx.createRadialGradient(coin.x, coin.y, 2, coin.x, coin.y, animatedRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.8)');

        ctx.beginPath();
        ctx.arc(coin.x, coin.y, animatedRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 🎯 Coin collision
        const dx = coin.x - fish.current.x;
        const dy = coin.y - fish.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25) {
          score.current += 5;
          coins.current.splice(i, 1);
        }
      });

      coins.current = coins.current.filter(coin => coin.x + 10 > 0);

      // 🏆 Score display
      ctx.fillStyle = 'black';
      ctx.font = '18px Arial';
      ctx.fillText(`Score: ${score.current}`, 10, 20);
      ctx.fillText(`High Score: ${highScore}`, 10, 40);

      // 💥 Collision check
      if (checkCollision()) {
        if (gameState === 'playing') {
          hitSound.current?.play();
          setGameState('gameover');

          if (score.current > highScore) {
            localStorage.setItem('highScore', score.current);
            setHighScore(score.current);
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    const checkCollision = () => {
      return pipes.current.some(pipe => {
        const withinX = fish.current.x + 20 > pipe.x && fish.current.x - 20 < pipe.x + pipeWidth;
        const outsideGap = fish.current.y - 14 < pipe.gapY - gapSize / 2 || fish.current.y + 14 > pipe.gapY + gapSize / 2;
        return withinX && outsideGap;
      });
    };

    if (gameState === 'playing' || gameState === 'gameover') {
      draw();
    }

    return () => {
      gameRunning = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState]);

  const handleClick = () => {
    if (gameState === 'start') {
      resetGame();
    } else if (gameState === 'playing') {
      jumpSound.current?.play();
      fish.current.velocity = jumpForce;

      splashes.current.push({
        x: fish.current.x,
        y: fish.current.y + 20,
        radius: 5,
        opacity: 1,
        created: Date.now()
      });
    } else if (gameState === 'gameover') {
      setGameState('start');
    }
  };

  return (
    <div>
      <h3>🐟 Fish Game – Avoid pipes & collect shimmering coins!</h3>
      {gameState === 'start' && <p>Click to Start</p>}
      {gameState === 'countdown' && <p>Get Ready... {countdown}</p>}
      {gameState === 'gameover' && <p>💀 Game Over – Score: {score.current} – Click to restart</p>}

      <audio ref={jumpSound} src="/cartoon-jump-6462.mp3" />
      <audio ref={hitSound} src="/funny-sound-effect-for-quotjack-in-the-boxquot-sound-ver3-110925.mp3" />

      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{ border: '2px solid #000', backgroundColor: '#d0f0ff' }}
        onClick={handleClick}
      />
    </div>
  );
}

export default FishGame;
