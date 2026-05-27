import MidiWriter = require('midi-writer-js');
import { CompositionResult, MelodyNote } from './types';
import { noteNameToMidi, chordMidiNotes, chordRoot } from './musicUtils';

// Standard drum pattern on MIDI channel 10
function drumPattern(bpm: number, totalTicks: number): MidiWriter.NoteEvent[] {
  const events: MidiWriter.NoteEvent[] = [];
  const beatTicks = 128; // quarter note in MIDI ticks
  const kickNote: (string | number)[] = ['C2'];
  const snareNote: (string | number)[] = ['D2'];
  const hatNote: (string | number)[] = ['F#2'];

  let tick = 0;
  while (tick < totalTicks) {
    // Kick on 1 and 3
    if (tick % (beatTicks * 4) === 0 || tick % (beatTicks * 4) === beatTicks * 2) {
      events.push(new MidiWriter.NoteEvent({ pitch: kickNote, startTick: tick, duration: 'T64' }));
    }
    // Snare on 2 and 4
    if (tick % (beatTicks * 4) === beatTicks || tick % (beatTicks * 4) === beatTicks * 3) {
      events.push(new MidiWriter.NoteEvent({ pitch: snareNote, startTick: tick, duration: 'T64' }));
    }
    // Hi-hat on 8th notes
    events.push(new MidiWriter.NoteEvent({ pitch: hatNote, startTick: tick, duration: 'T96' }));
    tick += beatTicks / 2;
  }

  return events;
}

export function generateMidiBuffer(comp: CompositionResult): Buffer {
  const beatTicks = 128;
  const tickMultiplier = beatTicks; // 1 quarter = 128 ticks

  // ── Track 1: Melody (lead synth, channel 0) ──
  const melodyTrack = new MidiWriter.Track();
  melodyTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 81 })); // Lead 1 (Square)
  melodyTrack.addEvent(new MidiWriter.TextEvent({ text: 'Melody' }));

  let tick = 0;
  comp.melody.forEach((mn: MelodyNote) => {
    const midiNote = noteNameToMidi(mn.note);
    const durTicks = Math.round(mn.duration * tickMultiplier);
    const noteEvent = new MidiWriter.NoteEvent({
      pitch: [midiNote],
      duration: `T${Math.max(16, durTicks)}`,
      startTick: tick,
      velocity: 100,
    });
    melodyTrack.addEvent(noteEvent);
    tick += durTicks;
  });

  const totalTicks = tick;

  // ── Track 2: Chord pad (pad synth, channel 1) ──
  const chordTrack = new MidiWriter.Track();
  chordTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 90 })); // Pad 2 (Warm)
  chordTrack.addEvent(new MidiWriter.TextEvent({ text: 'Chords' }));

  const chords = comp.chordProgression || ['C'];
  const barTicks = beatTicks * 4; // each chord lasts one bar (4 beats)
  for (let bar = 0; bar * barTicks < totalTicks + barTicks; bar++) {
    const chord = chords[bar % chords.length];
    const notes = chordMidiNotes(chord);
    notes.forEach((midiNote) => {
      chordTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: [midiNote],
        duration: `T${barTicks - 8}`,
        startTick: bar * barTicks,
        velocity: 60,
      }));
    });
  }

  // ── Track 3: Bass (channel 2) ──
  const bassTrack = new MidiWriter.Track();
  bassTrack.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 33 })); // Electric Bass (finger)
  bassTrack.addEvent(new MidiWriter.TextEvent({ text: 'Bass' }));

  for (let bar = 0; bar * barTicks < totalTicks + barTicks; bar++) {
    const chord = chords[bar % chords.length];
    const rootMidi = noteNameToMidi(chordRoot(chord) + '2');
    // Simple bass pattern: root on beats 1, 2.5, 3, 3.5
    [0, beatTicks * 1.5, beatTicks * 2, beatTicks * 2.5].forEach((offset) => {
      bassTrack.addEvent(new MidiWriter.NoteEvent({
        pitch: [rootMidi],
        duration: 'T96',
        startTick: bar * barTicks + offset,
        velocity: 80,
      }));
    });
  }

  // ── Track 4: Drums (channel 9 = MIDI channel 10) ──
  const drumTrack = new MidiWriter.Track();
  drumTrack.addEvent(new MidiWriter.TextEvent({ text: 'Drums' }));
  drumPattern(comp.bpm, totalTicks + barTicks * 2).forEach((e) => drumTrack.addEvent(e));

  const write = new MidiWriter.Writer([melodyTrack, chordTrack, bassTrack, drumTrack]);
  return Buffer.from(write.buildFile());
}

export function calculateDuration(comp: CompositionResult): number {
  const totalBeats = comp.melody.reduce((sum, mn) => sum + mn.duration, 0);
  return (totalBeats * 60) / comp.bpm;
}
