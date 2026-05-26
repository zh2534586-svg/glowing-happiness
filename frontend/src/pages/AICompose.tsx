import { useState, useRef, useCallback } from 'react';
import { Zap, Play, Music, Square } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['流行', '古典', '电子', '爵士', 'R&B', '摇滚', '民谣', '嘻哈'];
const moods = ['欢快', '舒缓', '激昂', '忧伤', '浪漫', '神秘', '元气', '治愈'];
const keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'A Minor', 'E Minor'];

// Note-to-frequency: C3=130.81, each semitone *1.05946
function noteToFreq(note: string): number {
  const map: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
  const match = note.match(/^([A-G])(#?)(\d)$/);
  if (!match) return 440;
  const [, name, sharp, octave] = match;
  const semitone = map[name] + (sharp ? 1 : 0) + (parseInt(octave) - 4) * 12;
  return 440 * Math.pow(2, semitone / 12);
}

interface MelodyNote {
  note: string;
  syllable: string;
  duration: number;
}

function singMelody(bpm: number, melody: MelodyNote[], chords: string[], onSyllableChange: (index: number) => void): { stop: () => void } {
  const ctx = new AudioContext();
  const beatDuration = 60 / bpm;
  let stopped = false;

  // Chord accompaniment (soft pad)
  const chordMap: Record<string, number[]> = {};
  chords?.forEach((chord) => {
    const root = chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
    const baseFreq = noteToFreq(root + '3');
    if (chord.includes('m')) chordMap[chord] = [baseFreq, baseFreq * 1.189, baseFreq * 1.498];
    else chordMap[chord] = [baseFreq, baseFreq * 1.26, baseFreq * 1.498];
  });

  // Master gain
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.6;
  masterGain.connect(ctx.destination);

  // Build vocal chain: saw → formant filters → gain envelope
  function singNote(freq: number, startTime: number, duration: number, vibratoDepth: number = 0.3) {
    if (stopped) return;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Vibrato LFO
    if (duration > 0.15) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5.5;
      lfoGain.gain.value = freq * vibratoDepth * 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);
      lfo.stop(startTime + duration);
    }

    // Formant filters (female voice approximation)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 750;
    f1.Q.value = 8;

    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 1200;
    f2.Q.value = 6;

    const f3 = ctx.createBiquadFilter();
    f3.type = 'bandpass';
    f3.frequency.value = 2800;
    f3.Q.value = 4;

    const f4 = ctx.createBiquadFilter();
    f4.type = 'highshelf';
    f4.frequency.value = 4000;
    f4.gain.value = -6;

    // Amp envelope
    const noteGain = ctx.createGain();
    const attack = Math.min(0.03, duration * 0.15);
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.25, startTime + attack);
    noteGain.gain.setValueAtTime(0.25, startTime + duration * 0.7);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(f1);
    f1.connect(f2);
    f2.connect(f3);
    f3.connect(f4);
    f4.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  // Play chord pad
  function playChordBg() {
    if (stopped || !chords?.length) return;
    const totalDur = melody.reduce((sum, n) => sum + n.duration * beatDuration, 0);
    const barBeats = 4;
    const bars = Math.ceil(totalDur / (barBeats * beatDuration));
    const chordCycle = chords;

    for (let bar = 0; bar < bars; bar++) {
      const chord = chordCycle[bar % chordCycle.length];
      const freqs = chordMap[chord] || [261, 329, 392];
      freqs.forEach((f) => {
        if (stopped) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const start = bar * barBeats * beatDuration;
        const dur = barBeats * beatDuration;
        gain.gain.setValueAtTime(0.04, start);
        gain.gain.setValueAtTime(0.04, start + dur * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + dur);
      });
    }
  }

  // Schedule melody notes
  let time = ctx.currentTime + 0.15;
  let syllableIdx = 0;

  melody.forEach((mn) => {
    const freq = noteToFreq(mn.note);
    const dur = mn.duration * beatDuration;
    singNote(freq, time, dur, mn.duration > 0.5 ? 0.3 : 0.1);

    const idx = syllableIdx;
    const noteTime = time;
    const cb = () => onSyllableChange(idx);
    setTimeout(cb, Math.max(0, (noteTime - ctx.currentTime) * 1000));

    time += dur;
    syllableIdx++;
  });

  // Start chord pad slightly after first note
  setTimeout(() => playChordBg(), 50);

  return {
    stop: () => {
      stopped = true;
      ctx.close();
      onSyllableChange(-1);
    },
  };
}

export default function AICompose() {
  const [style, setStyle] = useState('流行');
  const [mood, setMood] = useState('欢快');
  const [key, setKey] = useState('C Major');
  const [bpm, setBpm] = useState(120);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSyllable, setCurrentSyllable] = useState(-1);
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleCompose = async () => {
    if (!user) return;
    setLoading(true);
    setCurrentSyllable(-1);
    try { const { data } = await api.post('/ai/compose', { style, mood, key, bpm }); setResult(data); } catch {}
    setLoading(false);
  };

  const handlePlay = useCallback(() => {
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
      setCurrentSyllable(-1);
      return;
    }
    if (!result) return;

    const melodyNotes = result.melody;
    if (!melodyNotes || melodyNotes.length === 0) return;

    setPlaying(true);
    setCurrentSyllable(0);

    const player = singMelody(
      result.bpm || bpm,
      melodyNotes,
      result.chordProgression || [],
      (idx: number) => setCurrentSyllable(idx),
    );
    playerRef.current = player;

    // Auto-stop after all notes played
    const totalBeats = melodyNotes.reduce((sum: number, n: MelodyNote) => sum + n.duration, 0);
    const totalMs = (totalBeats * 60) / (result.bpm || bpm) * 1000 + 500;
    setTimeout(() => {
      setPlaying(false);
      setCurrentSyllable(-1);
    }, totalMs);
  }, [playing, result, bpm]);

  return (
    <ToolPage title="AI作曲" description="AI自动生成原创旋律、和声和编曲，支持多种音乐风格" icon="🎼" model="MusicGen + MuseGAN" tech={['旋律生成', '和声编排', '多风格']}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">风格</label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${style === s ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">情绪</label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button key={m} onClick={() => setMood(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${mood === m ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{m}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">调性: {key}</label>
            <select value={key} onChange={(e) => setKey(e.target.value)} className="input-field">
              {keys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">BPM: {bpm}</label>
            <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full accent-primary-500 mt-3" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleCompose} disabled={loading || !user}
            className="gradient-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            <Zap size={18} /> {loading ? '作曲中...' : 'AI生成音乐'}
          </button>
          {result && (
            <button onClick={handlePlay}
              className={`px-6 rounded-xl flex items-center justify-center gap-2 transition-all ${
                playing ? 'bg-red-500/20 border border-red-500 text-red-400' : 'glass text-gray-400 hover:text-white'
              }`}>
              {playing ? <Square size={18} /> : <Play size={18} />}
              {playing ? '停止' : '播放'}
            </button>
          )}
        </div>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="space-y-3">
            <div className="glass-card !p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Music size={18} className="text-primary-400" /><span className="font-medium">{result.title}</span></div>
                <button onClick={handlePlay} className={`w-10 h-10 rounded-lg flex items-center justify-center ${playing ? 'bg-red-500/20' : 'bg-primary-500/20'}`}>{playing ? <Square size={18} className="text-red-400" /> : <Play size={18} className="text-primary-400" />}</button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.key}</span>
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.bpm} BPM</span>
                <span className="px-3 py-1 rounded-full bg-accent-500/10 text-accent-400">{result.mood}</span>
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">耗时: {result.processingTime}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.structure?.map((s: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-dark-100 text-gray-400">{s}</span>
                ))}
              </div>
              {result.melodyDescription && <p className="text-sm text-gray-400 mt-3 border-t border-primary-700/20 pt-2">{result.melodyDescription}</p>}
              {result.chordProgression && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.chordProgression.map((c: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-accent-500/10 text-accent-400">{c}</span>
                  ))}
                </div>
              )}
              {result.instrumentation && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.instrumentation.map((inst: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{inst}</span>
                  ))}
                </div>
              )}
              {result.melody && result.melody.length > 0 && (
                <div className="mt-3 border-t border-primary-700/20 pt-3">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                    <span>AI 演唱</span>
                    {playing && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                  </div>
                  <div className="flex flex-wrap gap-x-1 gap-y-1 leading-loose">
                    {result.melody.map((mn: MelodyNote, i: number) => (
                      <span
                        key={i}
                        className={`inline-flex flex-col items-center px-1 rounded transition-all duration-150 ${
                          i === currentSyllable
                            ? 'text-white bg-primary-500 scale-125 font-bold'
                            : 'text-gray-300'
                        }`}
                      >
                        <span className="text-[10px] text-gray-500 leading-none">{mn.note}</span>
                        <span>{mn.syllable}</span>
                      </span>
                    ))}
                  </div>
                  {result.lyrics && (
                    <div className="mt-3 pt-2 border-t border-dark-100">
                      <div className="text-xs text-gray-500 mb-1">完整歌词</div>
                      <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line">{result.lyrics}</p>
                    </div>
                  )}
                </div>
              )}

              {!result.melody && result.lyrics && (
                <div className="mt-3 border-t border-primary-700/20 pt-3">
                  <div className="text-xs text-gray-500 mb-1">AI生成歌词</div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{result.lyrics}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
