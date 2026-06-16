/** Som ambiente de vento sintetizado — volume e tom seguem a telemetria. */
export function createMarsWindAudio(windSpeed: number): () => void {
  let disposed = false;
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();

  const resume = () => {
    if (disposed || ctx.state === 'running') return;
    void ctx.resume();
  };
  document.addEventListener('pointerdown', resume, { once: true });
  void ctx.resume();

  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    data[i] = brown * 3.2;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 280 + windSpeed * 65;
  lowpass.Q.value = 0.6;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 60;

  const gain = ctx.createGain();
  gain.gain.value = Math.min(0.06 + windSpeed * 0.009, 0.22);

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.12 + windSpeed * 0.02;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.018;
  lfo.connect(lfoGain).connect(gain.gain);

  source.connect(highpass).connect(lowpass).connect(gain).connect(ctx.destination);
  source.start();
  lfo.start();

  return () => {
    disposed = true;
    document.removeEventListener('pointerdown', resume);
    try {
      source.stop();
      lfo.stop();
    } catch {
      /* já parado */
    }
    void ctx.close();
  };
}
