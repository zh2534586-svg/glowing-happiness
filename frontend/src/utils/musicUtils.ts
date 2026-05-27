// Music theory utilities — mirrors ai-service/src/musicUtils.ts

const NOTE_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Convert note name to frequency in Hz (A4 = 440, equal temperament) */
export function noteToFreq(note: string): number {
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 440;
  const semitone = NOTE_SEMITONE[match[1]] + (match[2] ? 1 : 0) + (parseInt(match[3]) - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

/** Map frequency to SpeechSynthesis pitch (C4 = 261.6 Hz → pitch 1.0) */
export function freqToSSPitch(freq: number): number {
  return Math.min(2.0, Math.max(0.3, freq / 261.6));
}

/** Get triad frequencies using exact equal-temperament ratios */
export function chordFreqs(chord: string): number[] {
  const rootName = chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
  const root = noteToFreq(rootName + '3');
  const isMinor = chord.includes('m') && !chord.includes('dim');
  const third = root * Math.pow(2, (isMinor ? 3 : 4) / 12);
  const fifth = root * Math.pow(2, 7 / 12);
  return [root, third, fifth];
}
