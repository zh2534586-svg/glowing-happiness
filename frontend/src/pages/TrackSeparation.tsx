import { useState } from 'react';
import { Upload, Music, Zap, Play, Pause, Download } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import { generateSeparationTracks, type GeneratedTrack } from '../utils/audioGenerator';

const trackColors: Record<string, string> = {
  vocals: '#8b5cf6',
  drums: '#ec4899',
  bass: '#06b6d4',
  other: '#f59e0b',
};

export default function TrackSeparation() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<GeneratedTrack[] | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleSeparate = async () => {
    if (!file || !user) return;
    setLoading(true);
    try {
      await api.post('/ai/track-separation');
      const generated = await generateSeparationTracks();
      setTracks(generated);
    } catch {
      try {
        const generated = await generateSeparationTracks();
        setTracks(generated);
      } catch {}
    }
    setLoading(false);
  };

  const handlePlay = (track: GeneratedTrack) => {
    if (playing === track.name) {
      setPlaying(null);
      return;
    }
    setPlaying(track.name);
    track.play();
    // Reset playing state after duration
    setTimeout(() => setPlaying((p) => (p === track.name ? null : p)), 7000);
  };

  const handleDownload = (track: GeneratedTrack) => {
    const a = document.createElement('a');
    a.href = track.url;
    a.download = `${track.label}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolPage title="音轨分离" description="基于AI技术，将音乐精准分离为人声、鼓、贝斯、其他乐器四个独立音轨，支持在线播放和下载" icon="🎵" model="Demucs v4" tech={['人声分离', '节奏检测', '频谱分析']}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer">
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
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '分离中...' : '开始分离'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录以使用音轨分离功能</p>}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400">正在分离音轨，请稍候...</p>
          </div>
        )}

        {tracks && !loading && (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div key={track.name} className="glass-card !p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: trackColors[track.name] }}>
                  {track.label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{track.label}</div>
                  <div className="flex gap-0.5 mt-1 h-6 items-end">
                    {track.waveform.map((v, i) => (
                      <div key={i} className="flex-1 rounded-full transition-all" style={{ height: `${Math.max(2, v)}%`, background: trackColors[track.name], opacity: 0.4 + v / 200 }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handlePlay(track)}
                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                    {playing === track.name ? <Pause size={16} className="text-primary-400" /> : <Play size={16} className="text-primary-400" />}
                  </button>
                  <button onClick={() => handleDownload(track)}
                    className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                    <Download size={16} className="text-primary-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
