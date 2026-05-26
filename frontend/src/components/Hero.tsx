import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Music, Shield, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-32">
      {/* Background effects */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse-slow" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary-500/30 mb-8 animate-float">
          <Sparkles size={16} className="text-primary-400" />
          <span className="text-sm text-gray-300">RVC / so-vits-svc 技术驱动</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">AI驱动</span>
          <br />
          <span className="text-white">下一代音乐创作平台</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          集成RVC、so-vits-svc等前沿AI语音技术，提供AI翻唱、AI作曲、AI MV、音轨分离、
          版权保护等全方位音乐AI服务，让每个人都能成为音乐创作者。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link to="/register" className="gradient-btn text-lg !px-8 !py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
            <Zap size={20} /> 免费开始创作
          </Link>
          <Link to="/ai-detection" className="gradient-btn-outline text-lg !px-8 !py-4 flex items-center gap-2 w-full sm:w-auto justify-center">
            <Play size={20} /> 体验AI检测
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: '50万+', label: '注册用户' },
            { value: '200万+', label: 'AI作品生成' },
            { value: '99.9%', label: '服务可用率' },
            { value: '500+', label: '企业客户' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card !p-4 text-center">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
