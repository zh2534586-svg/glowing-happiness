import { useState } from 'react';
import { Upload, Zap, Play, Disc3 } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const demoVoices = ['天后 - 流行女声', '古风女声 - 清韵', '摇滚男声 - 烈火', '二次元萌音'];

export default function AICover() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(demoVoices[0]);
  const [songTitle, setSongTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleCover = async () => {
    if (!file || !user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/cover', { songTitle, voice: selectedVoice }); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI翻唱" description="选择心仪的音色，一键翻唱任意歌曲，效果媲美专业录音" icon="🎶" model="RVC + so-vits-svc" tech={['音色克隆', '音高迁移', '韵律保持']}>
      <div className="space-y-6">
        {/* Voice selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">选择翻唱音色</label>
          <div className="grid grid-cols-2 gap-3">
            {demoVoices.map((voice) => (
              <button key={voice} onClick={() => setSelectedVoice(voice)}
                className={`p-3 rounded-xl text-sm text-left transition-all ${
                  selectedVoice === voice ? 'glass border-primary-500 text-primary-400 bg-primary-500/10' : 'glass text-gray-400 hover:text-white'
                }`}>
                <Disc3 size={16} className="inline mr-2" />{voice}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">歌曲名称</label>
          <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)}
            className="input-field" placeholder="输入要翻唱的歌曲名称..." />
        </div>

        <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer">
          <Upload size={48} className="text-primary-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">上传原唱音频</p>
          <p className="text-sm text-gray-500 mb-4">或输入歌曲链接</p>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="cover-upload" />
          <label htmlFor="cover-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">选择文件</label>
          {file && <p className="mt-3 text-sm text-primary-400">{file.name}</p>}
        </div>

        <button onClick={handleCover} disabled={!file || loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '翻唱中...' : '开始翻唱'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="glass-card !p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{result.originalSong || songTitle} → <span className="text-primary-400">{result.coverVoice}</span></div>
                <div className="text-xs text-gray-500">变调: {result.pitchShift || '自动'} | 耗时: {result.processingTime || '处理中'}</div>
              </div>
              <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
            </div>
            {result.arrangement && <p className="text-sm text-gray-400 border-t border-primary-700/20 pt-2">{result.arrangement}</p>}
            {result.vocalEffects && (
              <div className="flex flex-wrap gap-1">
                {result.vocalEffects.map((fx: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{fx}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  );
}
