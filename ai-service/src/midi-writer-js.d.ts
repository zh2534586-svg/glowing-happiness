declare module 'midi-writer-js' {
  namespace MidiWriter {
    interface NoteEventOptions {
      pitch?: (string | number)[];
      duration?: string;
      startTick?: number;
      velocity?: number;
      channel?: number;
      wait?: string | number;
      sequential?: boolean;
    }

    interface ProgramChangeEventOptions {
      instrument: number;
      channel?: number;
    }

    interface TextEventOptions {
      text: string;
      type?: string;
    }

    class NoteEvent {
      constructor(options: NoteEventOptions);
    }

    class ProgramChangeEvent {
      constructor(options: ProgramChangeEventOptions);
    }

    class TextEvent {
      constructor(options: TextEventOptions);
    }

    class Track {
      addEvent(event: any, mapFunction?: ((event: any) => any) | number): void;
      setTempo(bpm: number): void;
      setTimeSignature(numerator: number, denominator: number): void;
    }

    class Writer {
      constructor(tracks: Track[]);
      buildFile(): Uint8Array;
      base64(): string;
      dataUri(): string;
    }
  }

  export = MidiWriter;
}
