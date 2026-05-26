import { useState } from 'react';
import { Zap, Play, UserCircle, Music } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['流行', '摇滚', '民谣', 'R&B', '电子', '古风'];
const singers = [
  { name: '星尘', id: 'stardust_v3', desc: '全能型AI歌手，音域C3-C6', styles: ['流行', '摇滚', '民谣', 'R&B'] },
  { name: '洛天依', id: 'luotianyi_v4', desc: '中文虚拟歌手，擅长古风和流行', styles: ['流行', '古风', '民谣', '电子'] },
  { name: '初音未来', id: 'miku_v4x', desc: '日语虚拟歌手，电子风格出色', styles: ['流行', '电子', '摇滚'] },
  { name: 'AI男声-凌霄', id: 'lingxiao_v1', desc: '浑厚男中音，适合摇滚和民谣', styles: ['摇滚', '民谣', '流行'] },
];

export default function AISinger() {
  const [selectedSinger, setSelectedSinger] = useState(singers[0]);
  const [selectedStyle, setSelectedStyle] = useState('流行');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    try { const { data } = await api.post('/ai/singer', { singer: selectedSinger.id, style: selectedStyle }); setResult(data); } catch {}
    setLoading(false);
  };

  return (
    <ToolPage title="AI歌手" description="打造专属AI虚拟歌手，支持多种风格和音色定制" icon="🎙️" model="so-vits-svc 5.0" tech={['音色定制', '风格迁移', '情感注入']}>
      <div className="space-y-6">
        {/* Singer selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">选择AI歌手</label>
          <div className="grid grid-cols-2 gap-3">
            {singers.map((singer) => (
              <button key={singer.id} onClick={() => setSelectedSinger(singer)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedSinger.id === singer.id ? 'glass border-primary-500 bg-primary-500/10' : 'glass text-gray-400 hover:text-white'
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle size={20} className={selectedSinger.id === singer.id ? 'text-primary-400' : ''} />
                  <span className="font-medium">{singer.name}</span>
                </div>
                <p className="text-xs text-gray-500">{singer.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {singer.styles.map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{s}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Style selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">选择风格</label>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <button key={s} onClick={() => setSelectedStyle(s)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  selectedStyle === s ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !user}
          className="gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50">
          <Zap size={18} /> {loading ? '生成中...' : '生成AI歌手演示'}
        </button>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {result && (
          <div className="glass-card !p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center"><Music size={18} /></div>
              <div>
                <div className="font-medium">{result.singerName}</div>
                <div className="text-xs text-gray-500">{result.range} | 耗时: {result.processingTime}</div>
              </div>
            </div>
            <button className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center"><Play size={18} className="text-primary-400" /></button>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
