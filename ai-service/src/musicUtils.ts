// Shared music theory utilities — canonical source for note/frequency/chord math

const NOTE_SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Convert note name (e.g. "C4", "A#5") to MIDI note number */
export function noteNameToMidi(note: string): number {
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 60;
  const [, name, sharp, octave] = match;
  return NOTE_SEMITONE[name] + (sharp ? 1 : 0) + (parseInt(octave) + 1) * 12;
}

/** Convert note name to frequency in Hz (A4 = 440, equal temperament) */
export function noteToFreq(note: string): number {
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 440;
  const semitone = NOTE_SEMITONE[match[1]] + (match[2] ? 1 : 0) + (parseInt(match[3]) - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

/** Get the root note name from a chord symbol (strips quality suffixes) */
export function chordRoot(chord: string): string {
  return chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
}

/** Get triad frequencies for a chord symbol using exact equal-temperament ratios */
export function chordFreqs(chord: string, octave = 3): number[] {
  const root = noteToFreq(chordRoot(chord) + octave);
  const isMinor = chord.includes('m') && !chord.includes('dim');
  const third = root * Math.pow(2, (isMinor ? 3 : 4) / 12);
  const fifth = root * Math.pow(2, 7 / 12);
  return [root, third, fifth];
}

/** Get MIDI note numbers for a chord triad */
export function chordMidiNotes(chord: string): number[] {
  const root = noteNameToMidi(chordRoot(chord) + '3');
  const isMinor = chord.includes('m') && !chord.includes('dim');
  return [root, root + (isMinor ? 3 : 4), root + 7];
}
