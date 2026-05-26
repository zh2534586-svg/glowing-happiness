import { useState } from 'react';
import { Upload, Zap, Play, Video, Image } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['梦幻', '赛博朋克', '复古', '极简', '动漫', '写实', '水墨', '油画'];
const durations = ['0:30', '1:00', '1:30', '2:00', '3:00', '4:00'];

export default function AIMV() {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('梦幻');
  const [duration, setDuration] = useState('1:30');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/mv', { title: title || 'AI生成MV', style, duration }); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI MV" description="根据音乐自动生成高质量MV视频，多种视觉风格可选" icon="📺" model="Stable Video Diffusion" tech={['AI视频生成', '风格迁移', '音乐可视化']}>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-10 text-center hover:border-primary-500/50 transition-all cursor-pointer">
          <Upload size={48} className="text-primary-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">上传音乐文件</p>
          <p className="text-sm text-gray-500 mb-4">或粘贴音乐链接</p>
          <input type="file" accept="audio/*" className="hidden" id="mv-upload" />
          <label htmlFor="mv-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer">
            <Image size={18} /> 选择音乐
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">MV标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="输入MV标题（可选）" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">视觉风格</label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${style === s ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">时长</label>
            <div className="flex flex-wrap gap-2">
              {durations.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${duration === d ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '生成中...' : '生成MV'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="glass-card !p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Video size={18} className="text-primary-400" /><span className="font-medium">{result.title}</span></div>
              <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.resolution}</span>
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.duration}</span>
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">{result.scenes}个场景</span>
              <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400">耗时: {result.processingTime}</span>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
