import confetti from 'canvas-confetti';

/**
 * Result audio and celebration effects engine using Web Audio API
 * Synthesizes pure harmonic sound effects with zero external MP3 dependencies
 */

// Shared AudioContext helper with automatic resumption on user interaction
function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Plays an uplifting, triumphant victory fanfare for passed students (উত্তীর্ণ / পাস / A+)
 * Arpeggiated major chord + sparkling bell chimes
 */
export function playPassSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Arpeggio notes: C5, E5, G5, B5, C6
    const notes = [
      { freq: 523.25, time: 0, duration: 0.18, vol: 0.16 }, // C5
      { freq: 659.25, time: 0.10, duration: 0.18, vol: 0.16 }, // E5
      { freq: 783.99, time: 0.20, duration: 0.20, vol: 0.17 }, // G5
      { freq: 987.77, time: 0.30, duration: 0.22, vol: 0.18 }, // B5
      { freq: 1046.50, time: 0.40, duration: 0.55, vol: 0.22 }, // C6 (triumphant peak)
    ];

    notes.forEach(({ freq, time, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Warm, musical tone
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.linearRampToValueAtTime(vol, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration);

      // Shimmer bell harmonic
      const bellOsc = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bellOsc.type = 'sine';
      bellOsc.frequency.setValueAtTime(freq * 2, now + time); // Octave overtone
      bellGain.gain.setValueAtTime(0.0001, now + time);
      bellGain.gain.linearRampToValueAtTime(vol * 0.35, now + time + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration * 0.7);

      bellOsc.connect(bellGain);
      bellGain.connect(ctx.destination);

      bellOsc.start(now + time);
      bellOsc.stop(now + time + duration * 0.7);
    });

    // Final sparkling high chord (E6 + G6)
    const chordTime = now + 0.45;
    [1318.51, 1567.98].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0.0001, chordTime);
      gain.gain.linearRampToValueAtTime(0.08, chordTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, chordTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(chordTime);
      osc.stop(chordTime + 0.7);
    });
  } catch (err) {
    console.warn('Error playing pass sound:', err);
  }
}

/**
 * Plays a classic, expressive sad sound ("wah-wah-wah-waaaah" / sad trombone motif)
 * for failed students (ফেল / অনুত্তীর্ণ)
 */
export function playFailSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Classic 4-tone descending sad motif
    // 1: Eb4 (311.13)
    // 2: D4  (293.66)
    // 3: Db4 (277.18)
    // 4: C4  (261.63) sliding down to Bb3/A3 with vibrato
    const sadPhrases = [
      { startFreq: 311.13, endFreq: 305, time: 0, duration: 0.34, vol: 0.16 },
      { startFreq: 293.66, endFreq: 288, time: 0.36, duration: 0.34, vol: 0.16 },
      { startFreq: 277.18, endFreq: 270, time: 0.72, duration: 0.36, vol: 0.17 },
      { startFreq: 261.63, endFreq: 220, time: 1.10, duration: 1.15, vol: 0.20, isFinal: true },
    ];

    sadPhrases.forEach(({ startFreq, endFreq, time, duration, vol, isFinal }) => {
      const startTime = now + time;
      const stopTime = startTime + duration;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Muted brass/sad cello texture using filtered sawtooth/triangle
      osc.type = isFinal ? 'sawtooth' : 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isFinal ? 750 : 850, startTime);
      filter.frequency.linearRampToValueAtTime(450, stopTime);

      // Pitch slide downwards
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, stopTime);

      // Amplitude envelope (wah-wah shape)
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(vol * 0.75, startTime + duration * 0.65);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      // Add sad vibrato (wobble) to the final sustained note
      if (isFinal) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(5.5, startTime); // 5.5Hz vibrato wobble
        lfoGain.gain.setValueAtTime(7.0, startTime); // Depth in Hz
        lfo.connect(osc.frequency);
        lfo.start(startTime + 0.15);
        lfo.stop(stopTime);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(stopTime);
    });
  } catch (err) {
    console.warn('Error playing fail sound:', err);
  }
}

/**
 * Triggers a multi-stage celebratory confetti explosion
 * Used when a student passes (any passing grade, whether passed or A+)
 */
export function triggerPassConfetti(): void {
  try {
    const celebrationColors = [
      '#10b981', // emerald
      '#059669', // dark emerald
      '#3b82f6', // blue
      '#6366f1', // indigo
      '#f59e0b', // amber
      '#ec4899', // pink
      '#8b5cf6', // purple
    ];

    // 1. Initial center explosion
    confetti({
      particleCount: 85,
      spread: 75,
      origin: { y: 0.6 },
      colors: celebrationColors,
      ticks: 240,
      gravity: 1.1,
      scalar: 1.05,
    });

    // 2. Left side cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 60,
        origin: { x: 0.05, y: 0.65 },
        colors: celebrationColors,
        ticks: 220,
      });
    }, 200);

    // 3. Right side cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 60,
        origin: { x: 0.95, y: 0.65 },
        colors: celebrationColors,
        ticks: 220,
      });
    }, 380);
  } catch (e) {
    console.warn('Confetti trigger error:', e);
  }
}
