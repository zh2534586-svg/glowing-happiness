import { useState } from 'react';
import { Zap, Play, Smartphone, Hash } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const platforms = [
  { id: 'douyin', name: '抖音', ratio: '9:16', res: '1080x1920' },
  { id: 'kuaishou', name: '快手', ratio: '9:16', res: '1080x1920' },
  { id: 'bilibili', name: 'B站', ratio: '16:9', res: '1920x1080' },
  { id: 'youtube', name: 'YouTube Shorts', ratio: '9:16', res: '1080x1920' },
];

const templates = [
  { name: '音乐可视化', desc: '跟随节奏的视觉特效' },
  { name: '歌词动画', desc: '动态歌词展示' },
  { name: 'AI舞蹈', desc: '虚拟角色舞蹈' },
  { name: '场景MV', desc: 'AI生成场景画面' },
];

export default function AIShortVideo() {
  const [platform, setPlatform] = useState(platforms[0]);
  const [template, setTemplate] = useState(templates[0].name);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/short-video', { platform: platform.id, template }); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI短视频" description="一键生成抖音/快手/B站短视频，AI自动剪辑配乐加特效" icon="📱" model="SVD + ControlNet" tech={['AI剪辑', '音乐可视化', '自动字幕']}>
      <div className="space-y-6">
        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">目标平台</label>
          <div className="grid grid-cols-4 gap-2">
            {platforms.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p)}
                className={`p-3 rounded-xl text-center text-sm transition-all ${
                  platform.id === p.id ? 'glass border-primary-500 bg-primary-500/10' : 'glass text-gray-400 hover:text-white'
                }`}>
                <Smartphone size={18} className="mx-auto mb-1" />
                <div className="font-medium text-xs">{p.name}</div>
                <div className="text-xs text-gray-500">{p.ratio}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Template */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">视频模板</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button key={t.name} onClick={() => setTemplate(t.name)}
                className={`p-3 rounded-xl text-left text-sm transition-all ${
                  template === t.name ? 'glass border-primary-500 bg-primary-500/10' : 'glass text-gray-400 hover:text-white'
                }`}>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-500">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '生成中...' : '生成短视频'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="glass-card !p-4">
            <div className="flex items-center justify-between mb-3">
              <div><span className="font-medium">{result.platform}短视频</span></div>
              <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.resolution}</span>
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.duration}</span>
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">耗时: {result.processingTime}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {result.hashtags?.map((tag: string) => (
                <span key={tag} className="text-xs text-primary-400"><Hash size={12} className="inline" />{tag.replace('#', '')}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
