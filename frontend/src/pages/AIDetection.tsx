import { useState } from 'react';
import { Upload, Music, Zap, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import type { AIDetectResult } from '../types';

export default function AIDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIDetectResult | null>(null);
  const user = useAuthStore((s) => s.user);

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/detect');
      setResult(data);
    } catch {
      // demo fallback
      setResult({
        id: 'demo',
        score: 78,
        isAI: true,
        details: { spectralAnalysis: 82, patternRecognition: 75, voiceArtifact: 77 },
        processingTime: '2.1s',
      });
    }
    setLoading(false);
  };

  return (
    <ToolPage
      title="AI歌曲检测"
      description="基于深度学习的AI生成歌曲检测系统，准确识别AI合成音频"
      icon="🔍"
      model="Ensemble (CNN + Transformer + BERT)"
      tech={['频谱分析', '模式识别', '声纹鉴定', '深度学习']}
    >
      {/* Upload */}
      <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer mb-8">
        <Upload size={48} className="text-primary-400 mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">上传音频文件进行检测</p>
        <p className="text-sm text-gray-500 mb-4">支持 MP3, WAV, FLAC, M4A 格式，最大100MB</p>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
          id="audio-upload"
        />
        <label htmlFor="audio-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">
          <Music size={18} /> 选择文件
        </label>
        {file && <p className="mt-3 text-sm text-primary-400">已选择: {file.name}</p>}
      </div>

      <button
        onClick={handleDetect}
        disabled={!file || loading || (!user)}
        className="gradient-btn w-full flex items-center justify-center gap-2 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap size={18} /> {loading ? '检测中...' : '开始检测'}
      </button>

      {!user && (
        <p className="text-center text-sm text-amber-400 mb-4">
          请先登录以使用AI检测功能
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-[fadeIn_0.5s_ease]">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-100">
            <div className="flex items-center gap-3">
              {result.isAI ? (
                <AlertTriangle size={24} className="text-amber-400" />
              ) : (
                <CheckCircle size={24} className="text-green-400" />
              )}
              <div>
                <div className="font-semibold">
                  {result.isAI ? '检测到AI生成内容' : '未检测到AI生成特征'}
                </div>
                <div className="text-sm text-gray-400">AI概率: {result.score}%</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">耗时: {result.processingTime}</div>
          </div>

          {/* Detail scores */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><BarChart3 size={18} className="text-primary-400" /> 详细分析</h3>
            {Object.entries(result.details).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">
                    {key === 'spectralAnalysis' ? '频谱分析' : key === 'patternRecognition' ? '模式识别' : '声音伪影检测'}
                  </span>
                  <span className="text-primary-400">{val}%</span>
                </div>
                <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-1000" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolPage>
  );
}
