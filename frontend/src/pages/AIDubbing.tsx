import { useState } from 'react';
import { Zap, Play, Volume2 } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const voices = [
  { id: 'xiaoxiao', name: '晓晓', desc: '标准女声 - 温柔亲切', lang: 'zh-CN' },
  { id: 'yunxi', name: '云希', desc: '男声 - 沉稳大气', lang: 'zh-CN' },
  { id: 'xiaoyi', name: '晓伊', desc: '女声 - 活泼元气', lang: 'zh-CN' },
  { id: 'en-female', name: 'Emma', desc: 'English female - Professional', lang: 'en-US' },
  { id: 'ja-female', name: '花子', desc: '日本語女性 - 優しい', lang: 'ja-JP' },
  { id: 'ko-female', name: '수진', desc: '한국어 여성 - 친근한', lang: 'ko-KR' },
];

export default function AIDubbing() {
  const [text, setText] = useState('欢迎使用AI音乐平台，这是AI配音功能演示。');
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleDub = async () => {
    if (!text || !user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/dubbing', { text, voice: selectedVoice.id, speed }); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI配音" description="多语言AI配音，支持中文、英语、日语、韩语，自然流畅" icon="🎬" model="VITS + BERT" tech={['多语种', '情感合成', '韵律控制']}>
      <div className="space-y-6">
        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">配音文本</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            className="input-field h-32 resize-none" placeholder="请输入要配音的文本..." />
          <div className="text-right text-xs text-gray-500 mt-1">{text.length}/500</div>
        </div>

        {/* Voice selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">选择声音</label>
          <div className="grid grid-cols-3 gap-2">
            {voices.map((v) => (
              <button key={v.id} onClick={() => setSelectedVoice(v)}
                className={`p-3 rounded-xl text-center text-sm transition-all ${
                  selectedVoice.id === v.id ? 'glass border-primary-500 bg-primary-500/10' : 'glass text-gray-400 hover:text-white'
                }`}>
                <Volume2 size={16} className="mx-auto mb-1" />
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-gray-500">{v.lang}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed control */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">语速: {speed}x</label>
          <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={(e) => setSpeed(+e.target.value)}
            className="w-full accent-primary-500" />
        </div>

        <button onClick={handleDub} disabled={!text || loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '合成中...' : '开始配音'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="glass-card !p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{result.voice}</div>
              <div className="text-sm text-gray-400 truncate max-w-md">"{result.text}"</div>
              <div className="text-xs text-gray-500">时长: {result.duration}</div>
            </div>
            <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
