// Retro 8-bit sound effects for batch operations

export const playRetroSuccessSound = () => {
  try {
    const audioContext = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.value = freq;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const startTime = audioContext.currentTime + i * 0.1;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
    });
  } catch (error) {
    console.debug('Audio not supported');
  }
};

export const playRetroErrorSound = () => {
  try {
    const audioContext = new AudioContext();
    const notes = [392, 329.63, 261.63]; // G4, E4, C4 (descending)
    
    notes.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.value = freq;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const startTime = audioContext.currentTime + i * 0.15;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    });
  } catch (error) {
    console.debug('Audio not supported');
  }
};

export const playRetroTickSound = () => {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.value = 880; // A5
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const startTime = audioContext.currentTime;
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.03);
    
    gainNode.gain.setValueAtTime(0.05, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.03);
  } catch (error) {
    console.debug('Audio not supported');
  }
};
