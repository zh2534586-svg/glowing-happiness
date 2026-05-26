import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Music, Menu, X, ChevronDown, User, LogOut, CreditCard, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const navLinks = [
  {
    label: 'AI工具',
    children: [
      { to: '/ai-detection', label: 'AI歌曲检测', icon: '🔍' },
      { to: '/track-separation', label: '音轨分离', icon: '🎵' },
      { to: '/voice-conversion', label: 'AI转真人声', icon: '🎤' },
      { to: '/voice-enhance', label: '真人感增强', icon: '✨' },
    ],
  },
  {
    label: 'AI创作',
    children: [
      { to: '/ai-cover', label: 'AI翻唱', icon: '🎶' },
      { to: '/ai-singer', label: 'AI歌手', icon: '🎙️' },
      { to: '/ai-dubbing', label: 'AI配音', icon: '🎬' },
      { to: '/ai-compose', label: 'AI作曲', icon: '🎼' },
    ],
  },
  {
    label: 'AI视频',
    children: [
      { to: '/ai-mv', label: 'AI MV', icon: '📺' },
      { to: '/ai-short-video', label: 'AI短视频', icon: '📱' },
    ],
  },
  { to: '/voice-market', label: '音色商城' },
  { to: '/enterprise', label: '企业服务' },
  { to: '/copyright', label: '版权NFT' },
  { to: '/pricing', label: '定价' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <nav className="glass sticky top-0 z-50 border-b border-primary-700/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">
              <span className="gradient-text">AI</span>
              <span className="text-white">Music</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              'children' in link ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all">
                    {link.label} <ChevronDown size={14} />
                  </button>
                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 mt-1 w-56 glass rounded-xl p-2 shadow-2xl">
                      {link.children?.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <span>{child.icon}</span>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    location.pathname === link.to
                      ? 'text-primary-400 bg-primary-500/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* User section */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">{user.username}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">
                    {user.credits}积分
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl p-2 shadow-2xl">
                    <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={16} /> 仪表盘
                    </Link>
                    <Link to="/pricing" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5" onClick={() => setUserMenuOpen(false)}>
                      <CreditCard size={16} /> 升级套餐
                    </Link>
                    <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5">
                      <LogOut size={16} /> 退出登录
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-300 hover:text-white px-3 py-2 transition-colors">登录</Link>
                <Link to="/register" className="gradient-btn text-sm !px-4 !py-2">免费注册</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden text-gray-300" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden glass border-t border-primary-700/10 p-4 space-y-1">
          {navLinks.map((link) =>
            'children' in link ? (
              <div key={link.label}>
                <div className="px-3 py-2 text-sm text-gray-400 font-medium">{link.label}</div>
                {link.children?.map((child) => (
                  <Link key={child.to} to={child.to} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                    <span>{child.icon}</span> {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link key={link.to} to={link.to} className="block px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5" onClick={() => setMobileOpen(false)}>
                {link.label}
              </Link>
            )
          )}
          <div className="border-t border-primary-700/10 pt-3 mt-3">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300" onClick={() => setMobileOpen(false)}>
                  <User size={16} /> {user.username}
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-300">
                  退出登录
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3">
                <Link to="/login" className="gradient-btn-outline text-sm !px-4 !py-2 flex-1 text-center" onClick={() => setMobileOpen(false)}>登录</Link>
                <Link to="/register" className="gradient-btn text-sm !px-4 !py-2 flex-1 text-center" onClick={() => setMobileOpen(false)}>注册</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
