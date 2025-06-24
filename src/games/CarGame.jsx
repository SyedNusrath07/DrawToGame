import React, { useEffect, useRef, useState } from 'react';

function CarGame() {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [lane, setLane] = useState(1);
  const traffic = useRef([]);
  const fuels = useRef([]);
  const score = useRef(0);
  const fuelCollected = useRef(0);
  const carY = 350;
  const carWidth = 65;
  const carHeight = 110;
  const laneCount = 3;
  const laneWidth = 100;
  const roadStart = 40;
  const canvasWidth = roadStart * 2 + laneCount * laneWidth;
  const canvasHeight = 500;
  const heroImg = useRef(new Image());
  const enemyImg = useRef(new Image());
  const carSound = useRef(null);
  const crashSound = useRef(null);
  const roadLines = useRef([]);

  const gameInterval = useRef(null);
  const speed = useRef(2);

  useEffect(() => {
    heroImg.current.src = '/hero.png';
    enemyImg.current.src = '/enemy.png';
  }, []);

  const getLaneX = (laneIndex) => {
    return roadStart + laneIndex * laneWidth + (laneWidth - carWidth) / 2;
  };

  const handleGameOver = () => {
    setGameOver(true);
    clearInterval(gameInterval.current);
    carSound.current.pause();
    crashSound.current.currentTime = 0;
    crashSound.current.play();
  };

  const handleInput = (direction) => {
    if (gameOver) return;
    setLane((prev) => {
      if (direction === 'left') return Math.max(0, prev - 1);
      if (direction === 'right') return Math.min(laneCount - 1, prev + 1);
      return prev;
    });
  };

  const handleTouch = (e) => {
    if (gameOver) return;
    const x = e.nativeEvent.touches[0].clientX;
    const canvasMid = canvasRef.current.getBoundingClientRect().width / 2;
    handleInput(x < canvasMid ? 'left' : 'right');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let lastTime = 0;
    let lastSpawn = 0;

    if (!gameOver && carSound.current) {
      carSound.current.loop = true;
      carSound.current.volume = 0.5;
      carSound.current.play();
    }

    for (let i = 0; i < 10; i++) {
      roadLines.current.push({ y: i * 50 });
    }

    const gameLoop = (time) => {
      const delta = time - lastTime;
      lastTime = time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#444';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      for (let i = 1; i < laneCount; i++) {
        ctx.beginPath();
        ctx.setLineDash([20, 20]);
        ctx.moveTo(roadStart + i * laneWidth, 0);
        ctx.lineTo(roadStart + i * laneWidth, canvasHeight);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score.current}`, 10, 20);
      ctx.textAlign = 'left';
      ctx.fillText(`Fuel: ${fuelCollected.current}`, 10, 40);

      const playerX = getLaneX(lane);
      if (heroImg.current.complete) {
        ctx.drawImage(heroImg.current, playerX, carY, carWidth, carHeight);
      }

      traffic.current.forEach((car) => {
        car.y += speed.current;
        const carX = getLaneX(car.lane);
        if (enemyImg.current.complete) {
          ctx.drawImage(enemyImg.current, carX, car.y, carWidth, carHeight);
        }

        const overlapThreshold = 0.7;
        const xOverlap = Math.max(0, Math.min(playerX + carWidth, carX + carWidth) - Math.max(playerX, carX));
        const yOverlap = Math.max(0, Math.min(carY + carHeight, car.y + carHeight) - Math.max(carY, car.y));

        const xOverlapRatio = xOverlap / carWidth;
        const yOverlapRatio = yOverlap / carHeight;

        if (xOverlapRatio > overlapThreshold && yOverlapRatio > overlapThreshold) {
          handleGameOver();
        }
      });

      fuels.current.forEach((fuel, index) => {
        fuel.y += speed.current;
        const fuelX = getLaneX(fuel.lane);
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔥', fuelX + carWidth / 2, fuel.y + 28);

        const xOverlap = Math.max(0, Math.min(playerX + carWidth, fuelX + carWidth) - Math.max(playerX, fuelX));
        const yOverlap = Math.max(0, Math.min(carY + carHeight, fuel.y + 30) - Math.max(carY, fuel.y));

        if (xOverlap > 10 && yOverlap > 10) {
          fuelCollected.current++;
          score.current += 5;
          fuels.current.splice(index, 1);
        }
      });

      traffic.current = traffic.current.filter((car) => car.y < canvasHeight);
      fuels.current = fuels.current.filter((fuel) => fuel.y < canvasHeight);

      if (time - lastSpawn > 2000) {
        if (traffic.current.length < 2) {
          const laneOptions = [0, 1, 2];
          const laneUsed = traffic.current.map((c) => c.lane);
          const available = laneOptions.filter((l) => !laneUsed.includes(l));
          const laneToUse = available.length > 0
            ? available[Math.floor(Math.random() * available.length)]
            : Math.floor(Math.random() * laneCount);

          traffic.current.push({ lane: laneToUse, y: -carHeight });

          // 50% chance to add a fuel tank
          if (Math.random() < 0.5) {
            const fuelLaneOptions = [0, 1, 2].filter(l => !traffic.current.some(car => car.lane === l));
            if (fuelLaneOptions.length > 0) {
              const fuelLane = fuelLaneOptions[Math.floor(Math.random() * fuelLaneOptions.length)];
              fuels.current.push({ lane: fuelLane, y: -60 });
            }
          }

          lastSpawn = time;
          score.current += 1;
          if (score.current % 5 === 0 && speed.current < 6) speed.current += 0.2;
        }
      }

      if (!gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💥 GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Arial';
        ctx.fillText(`Score: ${score.current}`, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText(`Fuel Collected: ${fuelCollected.current}`, canvas.width / 2, canvas.height / 2 + 50);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lane, gameOver]);

  useEffect(() => {
    gameInterval.current = setInterval(() => {}, 1000);
    return () => clearInterval(gameInterval.current);
  }, [gameOver]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') handleInput('left');
      if (e.key === 'ArrowRight' || e.key === 'd') handleInput('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameOver]);

  return (
    <div onTouchStart={handleTouch}>
      <h3>🚗 Car Game – Swipe or Arrow Keys</h3>
      {gameOver && <p>💀 Game Over – Tap to restart</p>}
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '2px solid #000', background: '#444' }}
        onClick={() => {
          if (gameOver) {
            setGameOver(false);
            setLane(1);
            traffic.current = [];
            fuels.current = [];
            score.current = 0;
            fuelCollected.current = 0;
            speed.current = 2;
            roadLines.current = [];
          }
        }}
      />
      <audio ref={carSound} src="/car racing.mp3" />
      <audio ref={crashSound} src="/blast.mp3" />
    </div>
  );
}

export default CarGame;
