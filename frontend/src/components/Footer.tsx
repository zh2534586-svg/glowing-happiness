import { Link } from 'react-router-dom';
import { Music, Github, Twitter, MessageCircle } from 'lucide-react';

const footerLinks = [
  {
    title: 'AI工具',
    links: [
      { to: '/ai-detection', label: 'AI歌曲检测' },
      { to: '/track-separation', label: '音轨分离' },
      { to: '/voice-conversion', label: 'AI转真人声' },
      { to: '/voice-enhance', label: '真人感增强' },
    ],
  },
  {
    title: 'AI创作',
    links: [
      { to: '/ai-cover', label: 'AI翻唱' },
      { to: '/ai-singer', label: 'AI歌手' },
      { to: '/ai-dubbing', label: 'AI配音' },
      { to: '/ai-compose', label: 'AI作曲' },
    ],
  },
  {
    title: '商业服务',
    links: [
      { to: '/enterprise', label: '企业API' },
      { to: '/enterprise', label: 'SaaS订阅' },
      { to: '/enterprise', label: 'GPU云推理' },
      { to: '/enterprise', label: '私有化部署' },
    ],
  },
  {
    title: '生态',
    links: [
      { to: '/voice-market', label: '音色商城' },
      { to: '/copyright', label: '版权保护' },
      { to: '/copyright', label: 'NFT音乐' },
      { to: '/pricing', label: '定价方案' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="glass border-t border-primary-700/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Music size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="gradient-text">AI</span>Music
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              下一代AI音乐平台，用人工智能重新定义音乐创作。
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                <Github size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-primary-400 hover:bg-white/10 transition-all">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-gray-500 hover:text-primary-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-700/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; 2024 AI Music Platform. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <a href="#" className="hover:text-primary-400 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-primary-400 transition-colors">服务条款</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Cookie政策</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
