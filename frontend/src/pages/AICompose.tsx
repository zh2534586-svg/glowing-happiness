import { useState, useRef, useCallback, useEffect } from 'react';
import { Zap, Play, Music, Square } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['流行', '古风', '国风', '电子', '摇滚', '民谣', 'R&B', '爵士', '嘻哈', '古典', '轻音乐', '舞曲', '布鲁斯', '雷鬼', '放克', '金属'];
const moods = ['欢快', '舒缓', '激昂', '忧伤', '浪漫', '神秘', '元气', '治愈'];
const keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'A Minor', 'E Minor'];

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

// Preload voices — call early so getVoices() is populated when needed
function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // Prefer a Chinese voice with good quality
  const zhVoices = voices.filter((v) => v.lang.startsWith('zh'));
  // Try to find a female-sounding voice (usually better for singing)
  const female = zhVoices.find((v) => v.name.includes('Female') || v.name.includes('Ting') || v.name.includes('Yating') || v.name.includes('Xia') || v.name.includes('Ya'));
  if (female) return female;
  if (zhVoices.length > 0) return zhVoices[0];
  // Fallback to any voice
  return voices[0] || null;
}

// Map a musical note frequency to SpeechSynthesis pitch (0.1 - 2.0, where 1.0 ≈ C4 ≈ 262Hz)
function freqToSSPitch(freq: number): number {
  return Math.min(2.0, Math.max(0.3, freq / 261.6));
}

function singMelody(
  bpm: number, melody: MelodyNote[], chords: string[],
  onSyllableChange: (index: number) => void,
  voices: SpeechSynthesisVoice[],
): { stop: () => void } {
  const ctx = new AudioContext();
  ctx.resume();
  const beatDuration = 60 / bpm;
  let stopped = false;
  const voice = pickVoice(voices);

  // ── Chord accompaniment (Web Audio soft pad) ──
  const chordMap: Record<string, number[]> = {};
  chords?.forEach((chord) => {
    const root = chord.replace(/m7?|7|dim|aug|sus\d?/g, '');
    const baseFreq = noteToFreq(root + '3');
    if (chord.includes('m')) chordMap[chord] = [baseFreq, baseFreq * 1.189, baseFreq * 1.498];
    else chordMap[chord] = [baseFreq, baseFreq * 1.26, baseFreq * 1.498];
  });

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(ctx.destination);

  function playChordBg() {
    if (stopped || !chords?.length) return;
    const totalDur = melody.reduce((sum, n) => sum + n.duration * beatDuration, 0);
    const barBeats = 4;
    const bars = Math.ceil(totalDur / (barBeats * beatDuration));
    for (let bar = 0; bar < bars; bar++) {
      const chord = chords[bar % chords.length];
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

  // ── Vocal melody via SpeechSynthesis — chained onend for smooth flow ──
  // We build phrases of 2-4 chars so the TTS engine has phonetic context,
  // then chain phrase by phrase for continuous, clear singing.
  const phraseGap = (60 / bpm) * 200; // ms pause between phrases, scaled by tempo
  let phraseIdx = 0;

  function speakNextPhrase() {
    if (stopped) return;

    // Collect 2-4 syllables into one utterance for better TTS articulation
    const chars: string[] = [];
    let startIdx = phraseIdx;
    while (phraseIdx < melody.length && chars.length < 4) {
      chars.push(melody[phraseIdx].syllable);
      phraseIdx++;
    }

    if (chars.length === 0) return;

    // Build utterance text with spaces between characters for clarity
    const text = chars.join(' ');
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;

    // Use average pitch of the phrase
    const avgPitch = chars.reduce((sum, _, i) => {
      return sum + freqToSSPitch(noteToFreq(melody[startIdx + i].note));
    }, 0) / chars.length;
    u.pitch = avgPitch;
    u.rate = 0.88;
    u.volume = 1;

    u.onstart = () => {
      onSyllableChange(startIdx);
    };

    // Fire syllable highlights as each character is spoken (estimated)
    // SpeechSynthesis boundary events give word-level timing
    let charIdx = 0;
    u.onboundary = (e) => {
      if (e.charIndex !== undefined && e.charIndex > 0) {
        // Count spaces to estimate which character we're on
        const beforeText = text.substring(0, e.charIndex);
        const spaceCount = (beforeText.match(/ /g) || []).length;
        onSyllableChange(startIdx + spaceCount);
      }
    };

    u.onend = () => {
      if (stopped) return;
      if (phraseIdx < melody.length) {
        // Brief gap between phrases for musical phrasing
        setTimeout(speakNextPhrase, phraseGap);
      } else {
        onSyllableChange(-1);
      }
    };

    // Cancel is only used on stop(), never between syllables
    speechSynthesis.speak(u);
  }

  // Small initial delay then start
  setTimeout(speakNextPhrase, 150);

  // Start chords slightly after first note
  setTimeout(() => playChordBg(), 50);

  return {
    stop: () => {
      stopped = true;
      speechSynthesis.cancel();
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
  const [theme, setTheme] = useState('');
  const [customLyrics, setCustomLyrics] = useState('');
  const [showLyricsInput, setShowLyricsInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSyllable, setCurrentSyllable] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const user = useAuthStore((s) => s.user);

  // Preload TTS voices on mount
  useEffect(() => { preloadVoices().then(setVoices); }, []);

  const handleCompose = async () => {
    if (!user) return;
    setLoading(true);
    setCurrentSyllable(-1);
    try {
      const { data } = await api.post('/ai/compose', {
        style, mood, key, bpm,
        theme: theme.trim() || undefined,
        customLyrics: customLyrics.trim() || undefined,
      });
      setResult(data);
    } catch {}
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
      voices,
    );
    playerRef.current = player;

    // Auto-stop after all notes played
    const totalBeats = melodyNotes.reduce((sum: number, n: MelodyNote) => sum + n.duration, 0);
    const totalMs = (totalBeats * 60) / (result.bpm || bpm) * 1000 + 500;
    setTimeout(() => {
      setPlaying(false);
      setCurrentSyllable(-1);
    }, totalMs);
  }, [playing, result, bpm, voices]);

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

        {/* Theme / inspiration input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            创作主题 <span className="text-gray-500 font-normal">（可选，描述你想创作的内容）</span>
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例如：夏日海边、星空下的思念、都市夜归人..."
            className="input-field"
          />
        </div>

        {/* Custom lyrics toggle + textarea */}
        <div>
          <button
            onClick={() => { setShowLyricsInput(!showLyricsInput); if (!showLyricsInput) setCustomLyrics(''); }}
            className={`text-sm flex items-center gap-2 transition-all ${showLyricsInput ? 'text-primary-400' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <span className={`text-lg leading-none ${showLyricsInput ? 'opacity-100' : 'opacity-50'}`}>📝</span>
            {showLyricsInput ? '隐藏自定义歌词' : '自定义歌词（可选，留空则由AI生成）'}
          </button>
          {showLyricsInput && (
            <textarea
              value={customLyrics}
              onChange={(e) => setCustomLyrics(e.target.value)}
              placeholder="输入你的歌词，每句一行，AI将为你的歌词谱曲...&#10;例如：&#10;月光洒在窗台边&#10;思念随风飘很远&#10;你的笑容在眼前&#10;..."
              rows={6}
              className="input-field mt-2 resize-none"
            />
          )}
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

              {/* Style & meta tags */}
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {result.style && <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 font-medium">{result.style}</span>}
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.key}</span>
                <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.bpm} BPM</span>
                <span className="px-3 py-1 rounded-full bg-accent-500/10 text-accent-400">{result.mood}</span>
              </div>

              {/* Song structure */}
              {result.songStructure && (
                <div className="text-xs text-gray-400 mb-3 px-2 py-2 rounded-lg bg-dark-100/50">
                  <span className="text-gray-500">歌曲结构</span> {result.songStructure}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {result.structure?.map((s: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-dark-100 text-gray-400">{s}</span>
                ))}
              </div>
              {result.melodyDescription && <p className="text-sm text-gray-400 mt-3 border-t border-primary-700/20 pt-2">{result.melodyDescription}</p>}
              {result.chordProgression && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-gray-500">和弦进行</span>
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
                    <span className="text-gray-600 ml-auto">{result.melody.length}个音符</span>
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
                      <div className="text-xs text-gray-500 mb-2">完整歌词</div>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-dark-100/30 rounded-lg p-3 max-h-60 overflow-y-auto">
                        {result.lyrics.split('\n').map((line: string, i: number) => (
                          <p key={i} className={line.trim() ? 'mb-1' : 'h-3'}>{line.trim() || ' '}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result.melody && result.lyrics && (
                <div className="mt-3 border-t border-primary-700/20 pt-3">
                  <div className="text-xs text-gray-500 mb-2">AI生成歌词</div>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-dark-100/30 rounded-lg p-3">
                    {result.lyrics.split('\n').map((line: string, i: number) => (
                      <p key={i} className={line.trim() ? 'mb-1' : 'h-3'}>{line.trim() || ' '}</p>
                    ))}
                  </div>
                </div>
              )}

              {result.arrangementTips && (
                <div className="mt-3 border-t border-primary-700/20 pt-3">
                  <div className="text-xs text-gray-500 mb-1">编曲建议</div>
                  <p className="text-sm text-gray-400">{result.arrangementTips}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
