export interface MelodyNote {
  note: string;
  syllable: string;
  duration: number;
}

export interface CompositionResult {
  title: string;
  style: string;
  mood: string;
  bpm: number;
  key: string;
  structure: string[];
  chordProgression: string[];
  melodyDescription: string;
  instrumentation: string[];
  lyrics: string;
  melody: MelodyNote[];
  arrangementTips?: string;
  songStructure?: string;
  processingTime?: string;
}

export interface AudioOutput {
  midiUrl: string;
  midiPath: string;
  durationSec: number;
}
