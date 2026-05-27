import { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, Music, ChevronDown, ChevronUp, Download, Mic } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import AudioPlayer from '../components/AudioPlayer';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import { noteToFreq, freqToSSPitch, chordFreqs } from '../utils/musicUtils';

const styles = ['流行', '古风', '国风', '电子', '摇滚', '民谣', 'R&B', '爵士', '嘻哈', '古典', '轻音乐', '舞曲'];
const moods = ['欢快', '舒缓', '激昂', '忧伤', '浪漫', '神秘', '元气', '治愈'];

function preloadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
  });
}

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const zh = voices.filter((v) => v.lang.startsWith('zh'));
  const female = zh.find((v) => /Ting|Yating|Xia|Ya|Female/i.test(v.name));
  return female || zh[0] || voices[0] || null;
}

interface MelodyNote {
  note: string;
  syllable: string;
  duration: number;
}

interface CompositionResult {
  id?: string;
  title?: string;
  style?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  structure?: string[];
  chordProgression?: string[];
  melodyDescription?: string;
  instrumentation?: string[];
  lyrics?: string;
  melody?: MelodyNote[];
  arrangementTips?: string;
  songStructure?: string;
  genreTags?: string[];
  processingTime?: string;
  audioUrls?: { midiUrl?: string; instrumentalUrl?: string };
}

// ── Browser playback + recording ──

function playAndRecord(
  result: CompositionResult,
  voices: SpeechSynthesisVoice[],
  onSyllableChange: (i: number) => void,
  onComplete: (blob: Blob) => void,
): { stop: () => void } {
  const ctx = new AudioContext();
  ctx.resume();

  // Create media stream destination for recording
  const dest = ctx.createMediaStreamDestination();
  const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' });
  const chunks: BlobPart[] = [];
  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = () => onComplete(new Blob(chunks, { type: 'audio/webm' }));

  const beatDuration = 60 / (result.bpm || 120);
  let stopped = false;
  const allOscillators: OscillatorNode[] = [];
  const voice = pickVoice(voices);

  // Chord accompaniment (mixed into recording)
  const chordMap: Record<string, number[]> = {};
  const chords = result.chordProgression || [];
  chords.forEach((chord) => {
    chordMap[chord] = chordFreqs(chord);
  });

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(dest);
  masterGain.connect(ctx.destination);

  function playChordBg() {
    if (stopped || !chords.length) return;
    const totalDur = (result.melody || []).reduce((s: number, n: MelodyNote) => s + n.duration * beatDuration, 0);
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
        allOscillators.push(osc);
      });
    }
  }

  // Vocal via SpeechSynthesis (chained phrases)
  const melody = result.melody || [];
  const phraseGap = (60 / (result.bpm || 120)) * 200;
  let phraseIdx = 0;

  function speakNextPhrase() {
    if (stopped) return;
    const chars: string[] = [];
    let startIdx = phraseIdx;
    while (phraseIdx < melody.length && chars.length < 4) {
      chars.push(melody[phraseIdx].syllable);
      phraseIdx++;
    }
    if (chars.length === 0) {
      mediaRecorder.stop();
      return;
    }

    const text = chars.join(' ');
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    const avgPitch = chars.reduce((s, _, i) => s + freqToSSPitch(noteToFreq(melody[startIdx + i].note)), 0) / chars.length;
    u.pitch = avgPitch;
    u.rate = 0.88;
    u.volume = 1;

    u.onstart = () => onSyllableChange(startIdx);
    u.onboundary = (e) => {
      if (e.charIndex !== undefined && e.charIndex > 0) {
        const before = text.substring(0, e.charIndex);
        const spaces = (before.match(/ /g) || []).length;
        onSyllableChange(startIdx + spaces);
      }
    };
    u.onend = () => {
      if (stopped) return;
      if (phraseIdx < melody.length) {
        setTimeout(speakNextPhrase, phraseGap);
      } else {
        onSyllableChange(-1);
        setTimeout(() => {
          ctx.close();
          mediaRecorder.stop();
        }, 500);
      }
    };

    speechSynthesis.speak(u);
  }

  // Start recording + playback
  setTimeout(() => {
    mediaRecorder.start();
    playChordBg();
    speakNextPhrase();
  }, 300);

  return {
    stop: () => {
      stopped = true;
      speechSynthesis.cancel();
      allOscillators.forEach((osc) => { try { osc.stop(); } catch { /* already stopped */ } });
      if (mediaRecorder.state === 'recording') mediaRecorder.stop();
      try { ctx.close(); } catch { /* already closed */ }
      onSyllableChange(-1);
    },
  };
}

// ── Page Component ──

export default function AICompose() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('流行');
  const [mood, setMood] = useState('欢快');
  const [key, setKey] = useState('C Major');
  const [bpm, setBpm] = useState(120);
  const [customLyrics, setCustomLyrics] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<CompositionResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [currentSyllable, setCurrentSyllable] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const playerRef = useRef<{ stop: () => void } | null>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => { preloadVoices().then(setVoices); }, []);

  // Cleanup playback on unmount
  useEffect(() => () => { playerRef.current?.stop(); }, []);

  const handleCompose = async () => {
    if (!user) return;
    setLoading(true);
    setLoadingStep('正在生成旋律和歌词...');
    setResult(null);
    setRecordingBlob(null);
    setCurrentSyllable(-1);
    try {
      setLoadingStep('AI正在创作中...');
      const { data } = await api.post('/ai/compose', {
        prompt: prompt.trim() || undefined,
        style, mood, key, bpm,
        customLyrics: customLyrics.trim() || undefined,
      });
      setResult(data);
    } catch { /* empty */ }
    setLoading(false);
    setLoadingStep('');
  };

  // Play + record in browser
  const handlePlayAndRecord = useCallback(() => {
    if (playing) {
      playerRef.current?.stop();
      setPlaying(false);
      return;
    }
    if (!result?.melody?.length) return;

    setPlaying(true);
    setCurrentSyllable(0);

    const player = playAndRecord(
      result,
      voices,
      (idx) => setCurrentSyllable(idx),
      (blob) => setRecordingBlob(blob),
    );
    playerRef.current = player;

    const totalBeats = result.melody!.reduce((s, n) => s + n.duration, 0);
    const totalMs = (totalBeats * 60) / (result.bpm || 120) * 1000 + 3000;
    setTimeout(() => {
      setPlaying(false);
      setCurrentSyllable(-1);
    }, totalMs);
  }, [playing, result, voices]);

  const recordingUrl = recordingBlob ? URL.createObjectURL(recordingBlob) : null;

  return (
    <ToolPage title="AI作曲" description="用文字描述你想要的音乐，AI为你创作完整歌曲" icon="🎼" model="DeepSeek + MIDI Synth" tech={['旋律生成', 'MIDI编曲', '人声合成', '录音下载']}>
      <div className="space-y-5">
        {/* ── Main prompt input (Suno-style) ── */}
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想创作的音乐，例如：一首充满夏日气息的流行歌曲，有轻快的节奏和温暖的吉他，讲述在海边相遇的故事..."
            rows={3}
            className="input-field resize-none text-base"
          />
        </div>

        {/* ── Quick tags: style + mood ── */}
        <div className="flex flex-wrap gap-2">
          {styles.slice(0, 8).map((s) => (
            <button key={s} onClick={() => setStyle(s)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                style === s ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'
              }`}>{s}</button>
          ))}
          <span className="text-gray-600 text-xs self-center mx-1">|</span>
          {moods.slice(0, 6).map((m) => (
            <button key={m} onClick={() => setMood(m)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                mood === m ? 'bg-accent-500/20 border border-accent-500/50 text-accent-400' : 'glass text-gray-500 hover:text-gray-300'
              }`}>{m}</button>
          ))}
        </div>

        {/* ── Advanced options toggle ── */}
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all">
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          高级选项
        </button>

        {showAdvanced && (
          <div className="glass-card !p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">调性</label>
                <select value={key} onChange={(e) => setKey(e.target.value)} className="input-field text-sm">
                  {['C Major','D Major','E Major','F Major','G Major','A Major','A Minor','E Minor'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">BPM: {bpm}</label>
                <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(+e.target.value)} className="w-full accent-primary-500 mt-2" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">风格（全部）</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className="input-field text-sm">
                  {styles.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">自定义歌词（可选，每句一行）</label>
              <textarea
                value={customLyrics}
                onChange={(e) => setCustomLyrics(e.target.value)}
                placeholder="输入你的歌词，AI将为其谱曲..."
                rows={4}
                className="input-field resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Generate button ── */}
        <button onClick={handleCompose} disabled={loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50">
          <Sparkles size={20} /> {loading ? '创作中...' : '生成音乐'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录后使用AI作曲功能</p>}

        {/* ── Loading progress ── */}
        {loading && (
          <div className="text-center py-6 space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-400">{loadingStep}</p>
          </div>
        )}

        {/* ── Result cards ── */}
        {result && !loading && (
          <div className="space-y-4">
            {/* Main song card */}
            <div className="glass-card !p-5 space-y-4">
              {/* Title + meta */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music size={20} className="text-primary-400" />
                  <h3 className="text-lg font-bold">{result.title || '未命名作品'}</h3>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {result.style && <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 font-medium">{result.style}</span>}
                  {result.genreTags?.map((t: string) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-primary-500/10 text-primary-400">{t}</span>
                  ))}
                  <span className="px-2 py-1 rounded-full bg-dark-100 text-gray-400">{result.key}</span>
                  <span className="px-2 py-1 rounded-full bg-dark-100 text-gray-400">{result.bpm} BPM</span>
                  <span className="px-2 py-1 rounded-full bg-accent-500/10 text-accent-400">{result.mood}</span>
                </div>
              </div>

              {/* Song structure */}
              {result.songStructure && (
                <p className="text-sm text-gray-400 bg-dark-100/30 rounded-lg p-3">{result.songStructure}</p>
              )}

              {/* Structure tags */}
              {result.structure && (
                <div className="flex flex-wrap gap-1.5">
                  {result.structure.map((s: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-dark-100 text-gray-400">{s}</span>
                  ))}
                </div>
              )}

              {/* Instrumental audio player */}
              {result.audioUrls?.instrumentalUrl && (
                <div className="border-t border-primary-700/20 pt-3">
                  <span className="text-xs text-gray-500 block mb-2">伴奏音频</span>
                  <AudioPlayer
                    src={result.audioUrls.instrumentalUrl}
                    title={`${result.title || '作品'} - 伴奏`}
                    downloadUrl={result.audioUrls.instrumentalUrl}
                    downloadLabel="下载WAV"
                  />
                </div>
              )}

              {/* MIDI download */}
              {result.audioUrls?.midiUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <a
                    href={result.audioUrls.midiUrl}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-primary-400 transition-all"
                  >
                    <Download size={14} /> 下载MIDI文件
                  </a>
                  <span className="text-gray-500">可在DAW中编辑</span>
                </div>
              )}

              {/* AI演唱 section */}
              {result.melody && result.melody.length > 0 && (
                <div className="border-t border-primary-700/20 pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mic size={16} className="text-accent-400" />
                      <span className="text-sm font-medium">AI 演唱</span>
                      {playing && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handlePlayAndRecord}
                        className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                          playing ? 'bg-red-500/20 border border-red-500/50 text-red-400' : 'gradient-btn'
                        }`}>
                        {playing ? '停止' : '播放并录音'}
                      </button>
                      {recordingUrl && (
                        <a href={recordingUrl} download={`${result.title || '作品'}_演唱.webm`}
                          className="px-3 py-1.5 rounded-lg bg-accent-500/10 text-accent-400 text-sm flex items-center gap-1 hover:bg-accent-500/20 transition-all">
                          <Download size={14} /> 下载录音
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Syllable display with highlight */}
                  <div className="flex flex-wrap gap-x-1 gap-y-1 leading-loose max-h-40 overflow-y-auto">
                    {result.melody.map((mn, i) => (
                      <span key={i} className={`inline-flex flex-col items-center px-1 rounded transition-all duration-150 ${
                        i === currentSyllable ? 'text-white bg-primary-500 scale-125 font-bold' : 'text-gray-300'
                      }`}>
                        <span className="text-[10px] text-gray-500 leading-none">{mn.note}</span>
                        <span>{mn.syllable}</span>
                      </span>
                    ))}
                  </div>

                  {/* Chord progression */}
                  {result.chordProgression && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="text-xs text-gray-500 mr-1">和弦</span>
                      {result.chordProgression.map((c: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-accent-500/10 text-accent-400">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lyrics */}
              {result.lyrics && (
                <div className="border-t border-primary-700/20 pt-3">
                  <span className="text-xs text-gray-500 block mb-2">歌词</span>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-dark-100/30 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {result.lyrics.split('\n').map((line: string, i: number) => (
                      <p key={i} className={line.trim() ? 'mb-1' : 'h-3'}>{line.trim() || ' '}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Arrangement tips */}
              {result.arrangementTips && (
                <div className="border-t border-primary-700/20 pt-3">
                  <span className="text-xs text-gray-500 block mb-1">编曲建议</span>
                  <p className="text-sm text-gray-400">{result.arrangementTips}</p>
                </div>
              )}

              {/* Instrumentation */}
              {result.instrumentation && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">配器</span>
                  {result.instrumentation.map((inst: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{inst}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
