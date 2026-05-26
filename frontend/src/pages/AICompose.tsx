import { useState, useRef } from 'react';
import { Zap, Play, Music, Square } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['流行', '古典', '电子', '爵士', 'R&B', '摇滚', '民谣', '嘻哈'];
const moods = ['欢快', '舒缓', '激昂', '忧伤', '浪漫', '神秘', '元气', '治愈'];
const keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'A Minor', 'E Minor'];

const NOTE_MAP: Record<string, number> = {
  'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23,
  'G': 392.00, 'A': 440.00, 'B': 493.88,
  'Am': 440.00, 'Dm': 293.66, 'Em': 329.63, 'Fm': 349.23,
  'Gm': 392.00, 'E7': 329.63, 'A7': 440.00, 'G7': 392.00,
};

function getChordNotes(chord: string): number[] {
  const root = chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
  const base = NOTE_MAP[root] || NOTE_MAP[chord] || 440;
  if (chord.includes('m')) return [base, base * 1.189, base * 1.498];
  return [base, base * 1.26, base * 1.498];
}

function playMelody(bpm: number, chords: string[], structure: string[]): { stop: () => void } {
  const ctx = new AudioContext();
  const beatDuration = 60 / bpm;
  let stopped = false;

  const playChord = (freqs: number[], start: number, dur: number) => {
    if (stopped) return;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.08 / freqs.length, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    });
  };

  let time = ctx.currentTime + 0.1;
  const sections = structure?.length > 0 ? structure : ['intro', 'verse', 'chorus', 'outro'];
  const chordCycle = chords?.length > 0 ? chords : ['C', 'G', 'Am', 'F'];

  for (let s = 0; s < Math.min(sections.length, 8); s++) {
    const barsInSection = s === 0 || s === sections.length - 1 ? 2 : 4;
    for (let b = 0; b < barsInSection; b++) {
      const chord = chordCycle[(s + b) % chordCycle.length];
      const notes = getChordNotes(chord);
      playChord(notes, time, beatDuration * 4);
      // melody note
      const melodyNote = notes[0] * [1, 1.5, 0.75, 1.25][b % 4];
      const melOsc = ctx.createOscillator();
      const melGain = ctx.createGain();
      melOsc.type = 'sine';
      melOsc.frequency.value = melodyNote;
      melGain.gain.setValueAtTime(0.1, time);
      melGain.gain.exponentialRampToValueAtTime(0.001, time + beatDuration * 3);
      melOsc.connect(melGain);
      melGain.connect(ctx.destination);
      melOsc.start(time);
      melOsc.stop(time + beatDuration * 3);
      time += beatDuration * 4;
    }
  }

  return {
    stop: () => {
      stopped = true;
      ctx.close();
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
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleCompose = async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/compose', { style, mood, key, bpm }); setResult(data); } catch {}
    setLoading(false);
  };

  const handlePlay = () => {
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
      return;
    }
    if (!result) return;
    setPlaying(true);
    const player = playMelody(result.bpm || bpm, result.chordProgression || [], result.structure || []);
    playerRef.current = player;
    const totalBeats = (result.structure?.length || 4) * 4 * 4;
    const totalDuration = (totalBeats * 60) / (result.bpm || bpm) * 1000;
    setTimeout(() => setPlaying(false), totalDuration + 500);
  };

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
              {result.lyrics && (
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
