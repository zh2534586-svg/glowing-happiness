import { useState } from 'react';
import { Upload, Zap, Sparkles } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

export default function VoiceEnhance() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleEnhance = async () => {
    if (!file || !user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/voice-enhance'); setResult(data); } catch {}
    setLoading(false);
  };

  const labels: Record<string, string> = { breathControl: '呼吸感', emotionExpress: '情感表达', prosodyNatural: '韵律自然度', timbreRichness: '音色丰富度' };

  return (
    <ToolPage title="真人感增强" description="基于so-vits-svc 5.0，全方位增强AI语音的真人感和自然度" icon="✨" model="so-vits-svc 5.0" tech={['歌声合成', '变分推理', '对抗训练']}>
      <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer mb-8">
        <Upload size={48} className="text-primary-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">上传待增强的AI音频</p>
        <p className="text-sm text-gray-500 mb-4">支持 MP3, WAV 格式</p>
        <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="ve-upload" />
        <label htmlFor="ve-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">
          <Sparkles size={18} /> 选择文件
        </label>
        {file && <p className="mt-3 text-sm text-primary-400">{file.name}</p>}
      </div>

      <button onClick={handleEnhance} disabled={!file || loading || !user}
        className="gradient-btn w-full flex items-center justify-center gap-2 mb-6 disabled:opacity-50">
        <Zap size={18} /> {loading ? '增强中...' : '开始增强'}
      </button>

      {!user && <p className="text-center text-sm text-amber-400 mb-4">请先登录</p>}

      {result && (
        <div className="space-y-4">
          <div className="glass-card !p-4 text-center">
            <div className="text-sm text-gray-400">综合评分</div>
            <div className="text-4xl font-bold gradient-text">{result.overallScore}/100</div>
            <div className="text-xs text-gray-500 mt-1">模型: {result.model} | 耗时: {result.processingTime}</div>
          </div>
          {Object.entries(result.enhancements).map(([key, val]) => (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{labels[key] || key}</span>
                <span className="text-primary-400">{val as number}%</span>
              </div>
              <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${val}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolPage>
  );
}
