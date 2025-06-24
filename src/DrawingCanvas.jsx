import React, { useRef, useEffect, useState } from 'react';

function DrawingCanvas({ onClassify }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoords = (e) => {
    if (e.touches) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      };
    }
  };

  const startDrawing = (e) => {
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleSubmit = () => {
    setLoading(true);
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png', 0.4);
    onClassify(imageData);
    setTimeout(() => {
      setLoading(false);
      handleClear(); // clear canvas after classify
    }, 1000);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 20 }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        style={{
          border: '3px solid #222',
          borderRadius: '12px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          cursor: 'crosshair',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {loading && (
        <p style={{ marginTop: '10px', fontStyle: 'italic' }}>🔍 Matching your drawing...</p>
      )}

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '8px 16px',
            fontSize: '16px',
            marginRight: '10px',
            borderRadius: '6px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🎯 Classify
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          style={{
            padding: '8px 16px',
            fontSize: '16px',
            borderRadius: '6px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🧽 Clear
        </button>
      </div>
    </div>
  );
}

export default DrawingCanvas;
