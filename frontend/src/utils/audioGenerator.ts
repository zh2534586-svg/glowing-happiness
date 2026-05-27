const SAMPLE_RATE = 44100;

function noteToFreq(note: string): number {
  const map: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 440;
  const [, name, sharp, octave] = match;
  const semitone = map[name] + (sharp ? 1 : 0) + (parseInt(octave) - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

// ==== WAV encoding (pure math, no Web Audio dependency) ====

function floatTo16Bit(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
}

function buildWav(samples: Float32Array): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const dataSize = samples.length * numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const buf = new ArrayBuffer(totalSize);
  const v = new DataView(buf);

  const w = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  w(0, 'RIFF');
  v.setUint32(4, totalSize - 8, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, (SAMPLE_RATE * numChannels * bitsPerSample) / 8, true);
  v.setUint16(32, (numChannels * bitsPerSample) / 8, true);
  v.setUint16(34, bitsPerSample, true);
  w(36, 'data');
  v.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    v.setInt16(offset, floatTo16Bit(samples[i]), true);
    offset += 2;
  }
  return buf;
}

// ==== Per-track sample generators ====

function genVocalsSamples(durationSec: number): { samples: Float32Array; waveform: number[] } {
  const len = Math.ceil(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(len);

  const melody = [
    { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.75 },
    { note: 'G4', dur: 0.25 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 },
    { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 1 },
    { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
    { note: 'B4', dur: 0.5 }, { note: 'C5', dur: 0.75 }, { note: 'B4', dur: 0.25 },
    { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1 },
  ];

  let sampleIdx = 0;
  for (const { note, dur } of melody) {
    const freq = noteToFreq(note);
    const noteLen = Math.floor(SAMPLE_RATE * dur);
    for (let i = 0; i < noteLen && sampleIdx < len; i++, sampleIdx++) {
      const t = i / SAMPLE_RATE;
      // Sawtooth wave (rich harmonics for vocal formant)
      const phase = (t * freq) % 1;
      const saw = 2 * phase - 1;
      // Simple envelope
      const attack = Math.min(1, t / 0.02);
      const release = Math.max(0, 1 - (t - dur * 0.7) / (dur * 0.3));
      const env = Math.min(attack, release);
      // Mix in some harmonics for formant-like character
      const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3 + Math.sin(2 * Math.PI * freq * 3 * t) * 0.15;
      samples[sampleIdx] = (saw * 0.35 + harmonic) * env;
    }
  }

  return { samples, waveform: computeWaveform(samples) };
}

function genDrumsSamples(durationSec: number): { samples: Float32Array; waveform: number[] } {
  const len = Math.ceil(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(len);
  const beatDur = 0.5;
  const bars = Math.floor(durationSec / (beatDur * 4));

  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 8; beat++) {
      const t = bar * beatDur * 4 + beat * beatDur;
      const startIdx = Math.floor(t * SAMPLE_RATE);
      if (startIdx >= len) break;

      // Kick (beats 0, 4)
      if (beat === 0 || beat === 4) {
        const kickLen = Math.floor(0.3 * SAMPLE_RATE);
        for (let i = 0; i < kickLen && startIdx + i < len; i++) {
          const pt = i / SAMPLE_RATE;
          const kickFreq = 150 - pt * 400; // frequency sweep down
          const env = Math.exp(-pt * 12);
          samples[startIdx + i] += Math.sin(2 * Math.PI * Math.max(20, kickFreq) * pt) * env * 0.5;
        }
      }
      // Snare (beats 2, 6)
      if (beat === 2 || beat === 6) {
        const snareLen = Math.floor(0.2 * SAMPLE_RATE);
        for (let i = 0; i < snareLen && startIdx + i < len; i++) {
          const pt = i / SAMPLE_RATE;
          const noise = Math.random() * 2 - 1;
          const tone = Math.sin(2 * Math.PI * 200 * pt);
          const env = Math.exp(-pt * 15);
          samples[startIdx + i] += (noise * 0.6 + tone * 0.3) * env * 0.35;
        }
      }
      // Hi-hat (every beat)
      const hhLen = Math.floor(0.06 * SAMPLE_RATE);
      for (let i = 0; i < hhLen && startIdx + i < len; i++) {
        const pt = i / SAMPLE_RATE;
        const noise = Math.random() * 2 - 1;
        const env = Math.exp(-pt * 60);
        samples[startIdx + i] += noise * env * 0.18;
      }
      // Offbeat hi-hat
      if (beat % 2 === 1) {
        const offIdx = Math.floor((t + beatDur / 2) * SAMPLE_RATE);
        for (let i = 0; i < hhLen && offIdx + i < len; i++) {
          const pt = i / SAMPLE_RATE;
          samples[offIdx + i] += (Math.random() * 2 - 1) * Math.exp(-pt * 60) * 0.12;
        }
      }
    }
  }

  return { samples, waveform: computeWaveform(samples) };
}

function genBassSamples(durationSec: number): { samples: Float32Array; waveform: number[] } {
  const len = Math.ceil(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(len);

  const bassline = [
    { note: 'C2', dur: 0.75 }, { note: 'C2', dur: 0.25 }, { note: 'G2', dur: 0.5 },
    { note: 'A2', dur: 0.5 }, { note: 'F2', dur: 0.75 }, { note: 'F2', dur: 0.25 },
    { note: 'C2', dur: 0.5 }, { note: 'G2', dur: 0.5 },
  ];

  let sampleIdx = 0;
  while (sampleIdx < len) {
    for (const { note, dur } of bassline) {
      const freq = noteToFreq(note);
      const noteLen = Math.floor(SAMPLE_RATE * dur);
      for (let i = 0; i < noteLen && sampleIdx < len; i++, sampleIdx++) {
        const t = i / SAMPLE_RATE;
        const phase = (t * freq) % 1;
        const saw = 2 * phase - 1;
        // Low-pass filtering effect via simple averaging
        const attack = Math.min(1, t / 0.015);
        const sustain = Math.min(1, (dur - t) / 0.05);
        const env = Math.min(attack, sustain);
        samples[sampleIdx] = saw * env * 0.4;
      }
    }
  }

  return { samples, waveform: computeWaveform(samples) };
}

function genOtherSamples(durationSec: number): { samples: Float32Array; waveform: number[] } {
  const len = Math.ceil(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(len);

  const chords = [
    ['C3', 'E3', 'G3'],
    ['A2', 'C3', 'E3'],
    ['F2', 'A2', 'C3'],
    ['G2', 'B2', 'D3'],
  ];

  const barLen = 2;
  const totalBars = Math.ceil(durationSec / barLen);

  for (let bar = 0; bar < totalBars; bar++) {
    const chord = chords[bar % chords.length];
    const barStart = Math.floor(bar * barLen * SAMPLE_RATE);

    for (const note of chord) {
      const freq = noteToFreq(note);
      for (let i = 0; i < barLen * SAMPLE_RATE && barStart + i < len; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.min(1, t / 0.3) * Math.min(1, (barLen - t) / 0.1);
        samples[barStart + i] += Math.sin(2 * Math.PI * freq * t) * env * 0.06;
      }
    }
  }

  return { samples, waveform: computeWaveform(samples) };
}

function computeWaveform(samples: Float32Array): number[] {
  const pts = 40;
  const step = Math.floor(samples.length / pts);
  const wf: number[] = [];
  for (let i = 0; i < pts; i++) {
    let max = 0;
    for (let j = i * step; j < (i + 1) * step && j < samples.length; j++) {
      max = Math.max(max, Math.abs(samples[j]));
    }
    wf.push(Math.min(100, Math.round(max * 200)));
  }
  return wf;
}

// ==== Real-time playback ====

function playTrack(
  trackName: string,
  durationSec: number,
): { stop: () => void; audioCtx: AudioContext } {
  const ctx = new AudioContext();
  ctx.resume();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(ctx.destination);

  const beatDur = 0.5;
  const bars = Math.floor(durationSec / (beatDur * 4));
  let time = ctx.currentTime + 0.1;

  if (trackName === 'vocals') {
    const melody = [
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.75 },
      { note: 'G4', dur: 0.25 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 },
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 1 },
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'B4', dur: 0.5 }, { note: 'C5', dur: 0.75 }, { note: 'B4', dur: 0.25 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1 },
    ];
    for (const { note, dur } of melody) {
      if (time - ctx.currentTime > durationSec) break;
      const freq = noteToFreq(note);
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.frequency.value = 750;
      f1.Q.value = 3;
      const f2 = ctx.createBiquadFilter();
      f2.type = 'bandpass';
      f2.frequency.value = 1200;
      f2.Q.value = 2.5;
      const f3 = ctx.createBiquadFilter();
      f3.type = 'bandpass';
      f3.frequency.value = 2800;
      f3.Q.value = 2;

      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.55;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.12;

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(0.45, time + 0.02);
      noteGain.gain.setValueAtTime(0.4, time + dur * 0.7);
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(f1);
      f1.connect(f2);
      f2.connect(f3);
      f3.connect(wetGain);
      wetGain.connect(noteGain);
      osc.connect(dryGain);
      dryGain.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(time);
      osc.stop(time + dur + 0.02);
      time += dur;
    }
  } else if (trackName === 'drums') {
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 8; beat++) {
        const t = bar * beatDur * 4 + beat * beatDur;
        if (t > durationSec) break;

        if (beat === 0 || beat === 4) {
          // Kick
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, time + t);
          osc.frequency.exponentialRampToValueAtTime(40, time + t + 0.15);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.5, time + t);
          gain.gain.exponentialRampToValueAtTime(0.001, time + t + 0.3);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(time + t);
          osc.stop(time + t + 0.3);
        }
        if (beat === 2 || beat === 6) {
          // Snare (noise burst)
          const bufSize = Math.floor(SAMPLE_RATE * 0.15);
          const nb = ctx.createBuffer(1, bufSize, SAMPLE_RATE);
          const nd = nb.getChannelData(0);
          for (let i = 0; i < bufSize; i++) nd[i] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource();
          src.buffer = nb;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 900;
          bp.Q.value = 1.5;
          const hp = ctx.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 150;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.35, time + t);
          gain.gain.exponentialRampToValueAtTime(0.001, time + t + 0.15);
          src.connect(bp);
          bp.connect(hp);
          hp.connect(gain);
          gain.connect(masterGain);
          src.start(time + t);
          src.stop(time + t + 0.15);
        }
        // Hi-hat
        const hhBuf = ctx.createBuffer(1, Math.floor(SAMPLE_RATE * 0.05), SAMPLE_RATE);
        const hhd = hhBuf.getChannelData(0);
        for (let i = 0; i < hhd.length; i++) hhd[i] = Math.random() * 2 - 1;
        const hhSrc = ctx.createBufferSource();
        hhSrc.buffer = hhBuf;
        const hhHp = ctx.createBiquadFilter();
        hhHp.type = 'highpass';
        hhHp.frequency.value = 5000;
        const hhGain = ctx.createGain();
        hhGain.gain.setValueAtTime(0.12, time + t);
        hhGain.gain.exponentialRampToValueAtTime(0.001, time + t + 0.04);
        hhSrc.connect(hhHp);
        hhHp.connect(hhGain);
        hhGain.connect(masterGain);
        hhSrc.start(time + t);
        hhSrc.stop(time + t + 0.05);
      }
    }
  } else if (trackName === 'bass') {
    const bassline = [
      { note: 'C2', dur: 0.75 }, { note: 'C2', dur: 0.25 }, { note: 'G2', dur: 0.5 },
      { note: 'A2', dur: 0.5 }, { note: 'F2', dur: 0.75 }, { note: 'F2', dur: 0.25 },
      { note: 'C2', dur: 0.5 }, { note: 'G2', dur: 0.5 },
    ];
    let t = 0;
    while (t < durationSec) {
      for (const { note, dur } of bassline) {
        if (t > durationSec) break;
        const freq = noteToFreq(note);
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 350;
        lp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, time + t);
        gain.gain.setValueAtTime(0.3, time + t + dur * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, time + t + dur);
        osc.connect(lp);
        lp.connect(gain);
        gain.connect(masterGain);
        osc.start(time + t);
        osc.stop(time + t + dur + 0.02);
        t += dur;
      }
    }
  } else if (trackName === 'other') {
    const chords = [
      ['C3', 'E3', 'G3'], ['A2', 'C3', 'E3'],
      ['F2', 'A2', 'C3'], ['G2', 'B2', 'D3'],
    ];
    let t = 0;
    let ci = 0;
    while (t < durationSec) {
      const chord = chords[ci % chords.length];
      for (const note of chord) {
        const freq = noteToFreq(note);
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        const dur = 2;
        gain.gain.setValueAtTime(0.06, time + t);
        gain.gain.linearRampToValueAtTime(0.07, time + t + 0.3);
        gain.gain.setValueAtTime(0.06, time + t + dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, time + t + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time + t);
        osc.stop(time + t + dur);
      }
      t += 2;
      ci++;
    }
  }

  return {
    stop: () => {
      try { ctx.close(); } catch {}
    },
    audioCtx: ctx,
  };
}

// ==== Public API ====

export interface GeneratedTrack {
  name: string;
  label: string;
  blob: Blob;
  url: string;
  waveform: number[];
  play: () => void;
}

// Singleton to track active playback
let activePlayer: { stop: () => void } | null = null;

export async function generateSeparationTracks(): Promise<GeneratedTrack[]> {
  // Stop any existing playback
  activePlayer?.stop();
  activePlayer = null;

  const duration = 6;

  // Generate WAV samples for all 4 tracks (pure computation, no Web Audio)
  const trackDefs = [
    { name: 'vocals', label: '人声', gen: genVocalsSamples },
    { name: 'drums', label: '鼓', gen: genDrumsSamples },
    { name: 'bass', label: '贝斯', gen: genBassSamples },
    { name: 'other', label: '其他乐器', gen: genOtherSamples },
  ];

  return trackDefs.map(({ name, label, gen }) => {
    const { samples, waveform } = gen(duration);
    const wavData = buildWav(samples);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);

    return {
      name,
      label,
      blob,
      url,
      waveform,
      play: () => {
        activePlayer?.stop();
        const player = playTrack(name, duration);
        activePlayer = player;
        // Auto-stop after duration
        setTimeout(() => {
          if (activePlayer === player) {
            player.stop();
            activePlayer = null;
          }
        }, duration * 1000 + 500);
      },
    };
  });
}
