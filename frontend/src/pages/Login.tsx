import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('demo@aimusic.com');
  const [password, setPassword] = useState('demo123');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请稍后重试');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Music size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold"><span className="gradient-text">AI</span>Music</span>
          </Link>
          <h1 className="text-2xl font-bold">欢迎回来</h1>
          <p className="text-gray-400 mt-2">登录您的AI音乐平台账号</p>
        </div>

        <div className="glass-card glow-ring !p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

            <div>
              <label className="block text-sm text-gray-400 mb-1">邮箱</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field !pl-10" placeholder="请输入邮箱" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-10 !pr-10" placeholder="请输入密码" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="gradient-btn w-full disabled:opacity-50">
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            还没有账号？ <Link to="/register" className="text-primary-400 hover:underline">立即注册</Link>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-dark-100 text-xs text-gray-500">
            <p className="mb-1">🔑 演示账号：</p>
            <p>邮箱: demo@aimusic.com</p>
            <p>密码: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
