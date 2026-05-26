import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPwd) { setError('两次密码输入不一致'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    try {
      await register(email, username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败，请稍后重试');
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
          <h1 className="text-2xl font-bold">创建账号</h1>
          <p className="text-gray-400 mt-2">免费注册，开启AI音乐创作之旅</p>
        </div>

        <div className="glass-card glow-ring !p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

            <div>
              <label className="block text-sm text-gray-400 mb-1">用户名</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-field !pl-10" placeholder="请输入用户名" required />
              </div>
            </div>

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
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field !pl-10 !pr-10" placeholder="至少6位密码" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">确认密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="input-field !pl-10" placeholder="再次输入密码" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="gradient-btn w-full disabled:opacity-50">
              {loading ? '注册中...' : '免费注册'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            已有账号？ <Link to="/login" className="text-primary-400 hover:underline">立即登录</Link>
          </div>

          <p className="mt-4 text-xs text-gray-600 text-center">
            注册即表示同意 <a href="#" className="text-primary-400">服务条款</a> 和 <a href="#" className="text-primary-400">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
}
