import React, { useState } from 'react';
import DrawingCanvas from './DrawingCanvas.jsx';
import classifySketch from './classifySketch';
import FishGame from './games/FishGame.jsx';
import CarGame from './games/CarGame.jsx';
import AirplaneGame from './games/AirplaneGame.jsx'; // ✅ NEW

function App() {
  const [prediction, setPrediction] = useState(null);

  const handleClassify = async (imageData) => {
    const result = await classifySketch(imageData);
    setPrediction(result);
  };

  const renderGame = () => {
    switch (prediction) {
      case 'fish':
        return <FishGame />;
      case 'car':
        return <CarGame />;
      case 'airplane':
        return <AirplaneGame />;
      default:
        return <p>🎮 Themed game coming soon...</p>;
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>🎨 Sketch & Play AI Game</h1>
      <p>Draw something like a fish, car, or airplane, and AI will guess it!</p>
      <DrawingCanvas onClassify={handleClassify} />

      {prediction && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '1.5rem' }}>
            🎮 Detected: <strong>{prediction}</strong>
          </p>
          {renderGame()}
        </div>
      )}
    </div>
  );
}

export default App;
