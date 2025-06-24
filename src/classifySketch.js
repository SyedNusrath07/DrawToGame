const mockClasses = ['fish', 'airplane', 'car'];

function classifySketch(imageData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate a fake AI confidence logic (80% correct, 20% noisy)
      const random = Math.random();
      let result;

      if (random < 0.33) result = 'fish';
      else if (random < 0.66) result = 'airplane';
      else result = 'car';

      resolve(result);
    }, 600); // faster classification
  });
}

export default classifySketch;
