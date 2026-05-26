import { useState } from 'react';
import { Upload, Music, Zap, Play, Pause, Download } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import type { TrackSeparationResult } from '../types';

export default function TrackSeparation() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackSeparationResult | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleSeparate = async () => {
    if (!file || !user) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/track-separation');
      setResult(data);
    } catch { /* handled */ }
    setLoading(false);
  };

  const trackColors: Record<string, string> = { vocals: '#8b5cf6', drums: '#ec4899', bass: '#06b6d4', other: '#f59e0b' };

  return (
    <ToolPage title="音轨分离" description="基于Demucs v4模型，将音乐精准分离为人声、鼓、贝斯、其他乐器四个独立音轨" icon="🎵" model="Demucs v4" tech={['Meta AI', 'Hybrid Transformer', 'Spectral Separation']}>
      <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer mb-8">
        <Upload size={48} className="text-primary-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">上传音乐文件</p>
        <p className="text-sm text-gray-500 mb-4">支持 MP3, WAV, FLAC 格式</p>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="sep-upload" />
        <label htmlFor="sep-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">
          <Music size={18} /> 选择文件
        </label>
        {file && <p className="mt-3 text-sm text-primary-400">{file.name}</p>}
      </div>

      <button onClick={handleSeparate} disabled={!file || loading || !user}
        className="gradient-btn w-full flex items-center justify-center gap-2 mb-6 disabled:opacity-50">
        <Zap size={18} /> {loading ? '分离中...' : '开始分离'}
      </button>

      {!user && <p className="text-center text-sm text-amber-400 mb-4">请先登录以使用音轨分离功能</p>}

      {result && (
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-gray-400">
            <span>分离完成</span><span>耗时: {result.processingTime} | 模型: {result.model}</span>
          </div>
          {result.tracks.map((track) => (
            <div key={track.name} className="glass-card !p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: trackColors[track.name] }}>
                {track.label[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{track.label}</div>
                <div className="flex gap-1 mt-1 h-6 items-end">
                  {track.waveform.slice(0, 40).map((v, i) => (
                    <div key={i} className="flex-1 rounded-full transition-all" style={{ height: `${v}%`, background: trackColors[track.name], opacity: 0.4 + v / 200 }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPlaying(playing === track.name ? null : track.name)}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  {playing === track.name ? <Pause size={16} className="text-primary-400" /> : <Play size={16} className="text-primary-400" />}
                </button>
                <a href={track.url} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all" download>
                  <Download size={16} className="text-primary-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolPage>
  );
}
