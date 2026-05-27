import { useState } from 'react';
import { Upload, Zap, Play, Mic2, ThumbsUp } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

export default function VoiceConversion() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleConvert = async () => {
    if (!file || !user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/voice-conversion'); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI转真人声" description="基于RVC v2技术，将AI合成音色转换为自然真实的真人声音" icon="🎤" model="RVC v2" tech={['检索式语音转换', '音色克隆', 'HuBERT特征']}>
      <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer mb-8">
        <Upload size={48} className="text-primary-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">上传AI合成音频</p>
        <p className="text-sm text-gray-500 mb-4">支持 MP3, WAV 格式</p>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="vc-upload" />
        <label htmlFor="vc-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">
          <Mic2 size={18} /> 选择文件
        </label>
        {file && <p className="mt-3 text-sm text-primary-400">{file.name}</p>}
      </div>

      <button onClick={handleConvert} disabled={!file || loading || !user}
        className="gradient-btn w-full flex items-center justify-center gap-2 mb-6 disabled:opacity-50">
        <Zap size={18} /> {loading ? '转换中...' : '开始转换'}
      </button>

      {!user && <p className="text-center text-sm text-amber-400 mb-4">请先登录</p>}

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card !p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">自然度评分</div>
              <div className="text-3xl font-bold gradient-text">{result.naturalness}%</div>
            </div>
            <div className="glass-card !p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">音色相似度</div>
              <div className="text-3xl font-bold gradient-text">{result.similarity}%</div>
            </div>
          </div>
          <div className="glass-card !p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">{result.originalVoice} → <span className="text-primary-400">{result.convertedVoice}</span></div>
              <div className="text-xs text-gray-500 mt-1">耗时: {result.processingTime}</div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center hover:bg-primary-500/30"><Play size={18} className="text-primary-400" /></button>
              <button className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center hover:bg-green-500/30"><ThumbsUp size={18} className="text-green-400" /></button>
            </div>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
