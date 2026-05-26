import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Zap, FolderOpen, Key, CreditCard,
  Music, TrendingUp, Clock, ArrowRight, Plus, Copy, Check,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';
import type { Project, ApiKey } from '../types';

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    Promise.all([
      api.get('/user/projects'),
      api.get('/user/api-keys'),
    ]).then(([pRes, kRes]) => {
      setProjects(pRes.data.projects || []);
      setApiKeys(kRes.data.keys || []);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const quickActions = [
    { to: '/ai-detection', icon: '🔍', label: 'AI歌曲检测' },
    { to: '/track-separation', icon: '🎵', label: '音轨分离' },
    { to: '/ai-cover', icon: '🎶', label: 'AI翻唱' },
    { to: '/ai-compose', icon: '🎼', label: 'AI作曲' },
    { to: '/ai-mv', icon: '📺', label: 'AI MV' },
    { to: '/ai-short-video', icon: '📱', label: 'AI短视频' },
  ];

  const handleCreateApiKey = async () => {
    try {
      const { data } = await api.post('/user/api-keys', { name: `API Key ${apiKeys.length + 1}` });
      setApiKeys([...apiKeys, data.key]);
    } catch {}
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutDashboard size={24} className="text-primary-400" /> 仪表盘
            </h1>
            <p className="text-gray-400 mt-1">欢迎回来，{user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass px-4 py-2 rounded-xl text-sm">
              <span className="text-gray-400">套餐: </span>
              <span className="text-primary-400 font-medium">
                {{ free: '免费版', basic: '基础版', pro: '专业版', enterprise: '企业版' }[user.plan] || user.plan}
              </span>
            </div>
            <Link to="/pricing" className="gradient-btn text-sm !px-4 !py-2">升级</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Zap, label: '剩余积分', value: user.credits, color: 'text-yellow-400' },
            { icon: FolderOpen, label: '项目数', value: projects.length, color: 'text-blue-400' },
            { icon: Key, label: 'API密钥', value: apiKeys.length, color: 'text-green-400' },
            { icon: TrendingUp, label: '套餐', value: ({ free: '免费', basic: '基础', pro: '专业', enterprise: '企业' } as any)[user.plan] || user.plan, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-4">
              <div className="flex items-center gap-2 mb-2"><stat.icon size={18} className={stat.color} /><span className="text-sm text-gray-400">{stat.label}</span></div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">快速操作</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((a) => (
              <Link key={a.to} to={a.to} className="glass-card !p-3 text-center hover:border-primary-500/50 transition-all group">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{a.icon}</div>
                <div className="text-xs text-gray-400 group-hover:text-primary-400">{a.label}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Clock size={18} className="text-primary-400" /> 最近项目</h2>
              <Link to="/ai-detection" className="text-sm text-primary-400 flex items-center gap-1 hover:underline">新建 <Plus size={14} /></Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : projects.length === 0 ? (
              <div className="glass-card text-center !p-8">
                <Music size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">还没有项目</p>
                <Link to="/ai-detection" className="gradient-btn text-sm inline-flex items-center gap-2">开始第一个项目 <ArrowRight size={16} /></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((p) => (
                  <div key={p.id} className="glass p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-sm">
                        {{ detection: '🔍', separation: '🎵', voice_conversion: '🎤', cover: '🎶', compose: '🎼', mv: '📺' }[p.type] || '🎵'}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString('zh-CN')}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>{p.status === 'completed' ? '完成' : '处理中'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* API Keys */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Key size={18} className="text-primary-400" /> API密钥</h2>
              <button onClick={handleCreateApiKey} className="text-sm text-primary-400 flex items-center gap-1 hover:underline">创建 <Plus size={14} /></button>
            </div>
            {apiKeys.length === 0 ? (
              <div className="glass-card text-center !p-8">
                <Key size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">还没有API密钥</p>
                <button onClick={handleCreateApiKey} className="gradient-btn text-sm inline-flex items-center gap-2">创建API密钥 <ArrowRight size={16} /></button>
              </div>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="glass p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{key.name}</span>
                      <button onClick={() => { navigator.clipboard.writeText(key.key); setCopied(key.id); setTimeout(() => setCopied(null), 2000); }}
                        className="text-xs text-primary-400 flex items-center gap-1 hover:underline">
                        {copied === key.id ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制</>}
                      </button>
                    </div>
                    <code className="text-xs text-gray-500 bg-dark-100 px-2 py-1 rounded block truncate">{key.key}</code>
                    <div className="text-xs text-gray-600 mt-1">创建于 {new Date(key.createdAt).toLocaleDateString('zh-CN')} · 限流 {key.rateLimit}/min</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
