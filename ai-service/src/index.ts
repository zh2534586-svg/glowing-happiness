import * as fs from 'fs';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CompositionResult, AudioOutput } from './types';
import { generateMidiBuffer, calculateDuration } from './midiGenerator';

const execFileAsync = promisify(execFile);

const SOUNDFONT_PATH = '/usr/share/soundfonts/MuseScore_General.sf2';
const MIDI_OUTPUT_DIR = '/var/www/aimusic/backend/uploads/generated';

// Ensure output directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Generate MIDI file and optionally render to WAV via fluidsynth
export async function composeAudio(
  composition: CompositionResult,
  outputId: string,
): Promise<AudioOutput> {
  ensureDir(MIDI_OUTPUT_DIR);

  // 1. Generate MIDI buffer
  const midiBuffer = generateMidiBuffer(composition);

  // 2. Write MIDI file
  const midiFilename = `${outputId}.mid`;
  const midiPath = path.join(MIDI_OUTPUT_DIR, midiFilename);
  fs.writeFileSync(midiPath, midiBuffer);

  // 3. Try to render MIDI → WAV via fluidsynth (if available)
  const wavFilename = `${outputId}.wav`;
  const wavPath = path.join(MIDI_OUTPUT_DIR, wavFilename);

  let instrumentalRendered = false;
  try {
    if (fs.existsSync(SOUNDFONT_PATH)) {
      await execFileAsync('fluidsynth', [
        '-ni', '-F', wavPath, '-r', '44100', '-g', '1.5',
        SOUNDFONT_PATH, midiPath,
      ], { timeout: 60000 });
      instrumentalRendered = true;
    }
  } catch {
    // fluidsynth not available — skip instrumental WAV, frontend will use Web Audio
  }

  // 4. Try to convert WAV → MP3 via ffmpeg
  const mp3Filename = `${outputId}.mp3`;
  const mp3Path = path.join(MIDI_OUTPUT_DIR, mp3Filename);

  if (instrumentalRendered) {
    try {
      await execFileAsync('ffmpeg', [
        '-i', wavPath, '-c:a', 'libmp3lame', '-b:a', '192k', '-y', mp3Path,
      ], { timeout: 30000 });
    } catch {
      // ffmpeg not available — skip MP3
    }
  }

  const durationSec = calculateDuration(composition);

  return {
    midiUrl: `/uploads/generated/${midiFilename}`,
    midiPath,
    durationSec,
  };
}

// Synthesize instrumental WAV from melody data using pure math (no external tools needed)
export function synthesizeInstrumentalWav(composition: CompositionResult): Buffer {
  const sampleRate = 44100;
  const durationSec = calculateDuration(composition) + 2; // 2s padding
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 4); // 16-bit stereo

  const noteMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function noteToFreq(note: string): number {
    const match = note.match(/^([A-G])(#?)(\d)$/);
    if (!match) return 440;
    const semitone = noteMap[match[1]] + (match[2] ? 1 : 0) + (parseInt(match[3]) - 4) * 12;
    return 440 * Math.pow(2, semitone / 12);
  }

  function chordRoots(chord: string): number[] {
    const root = chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
    const base = noteToFreq(root + '3');
    if (chord.includes('m')) return [base, base * 1.189, base * 1.498];
    return [base, base * 1.26, base * 1.498];
  }

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 4, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(2, 22); // stereo
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);

  const beatDur = 60 / composition.bpm;
  const chords = composition.chordProgression || ['C'];
  const barBeats = 4;

  function writeSample(offset: number, value: number) {
    const sample = Math.max(-32768, Math.min(32767, Math.round(value * 32767)));
    buffer.writeInt16LE(sample, 44 + offset * 4);
    buffer.writeInt16LE(sample, 44 + offset * 4 + 2);
  }

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Chord pad
    const barIdx = Math.floor(t / (barBeats * beatDur));
    const chord = chords[barIdx % chords.length];
    const freqs = chordRoots(chord);
    freqs.forEach((f) => {
      sample += 0.06 * Math.sin(2 * Math.PI * f * t);
    });

    // Bass
    const rootFreq = noteToFreq(chord.replace(/m7?|7|dim|aug|sus\d?/g, '') + '2');
    sample += 0.05 * Math.sin(2 * Math.PI * rootFreq * t);

    writeSample(i, sample);
  }

  return buffer;
}

export { CompositionResult, AudioOutput, MelodyNote } from './types';
export { generateMidiBuffer, calculateDuration } from './midiGenerator';
