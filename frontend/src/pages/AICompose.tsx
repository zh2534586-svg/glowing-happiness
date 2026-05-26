import { useState } from 'react';
import { Zap, Play, Music } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['流行', '古典', '电子', '爵士', 'R&B', '摇滚', '民谣', '嘻哈'];
const moods = ['欢快', '舒缓', '激昂', '忧伤', '浪漫', '神秘', '元气', '治愈'];
const keys = ['C Major', 'D Major', 'E Major', 'F Major', 'G Major', 'A Major', 'A Minor', 'E Minor'];

export default function AICompose() {
  const [style, setStyle] = useState('流行');
  const [mood, setMood] = useState('欢快');
  const [key, setKey] = useState('C Major');
  const [bpm, setBpm] = useState(120);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleCompose = async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/compose', { style, mood, key, bpm }); setResult(data); } catch {}
    setLoading(false);
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

        <button onClick={handleCompose} disabled={loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '作曲中...' : 'AI生成音乐'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="space-y-3">
            <div className="glass-card !p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Music size={18} className="text-primary-400" /><span className="font-medium">{result.title}</span></div>
                <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
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
