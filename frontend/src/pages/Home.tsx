import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import {
  Search, Music2, Mic2, Sparkles, Disc3, UserCircle,
  Video, Clapperboard, Music, ArrowRight, Shield,
  Cloud, Cpu, Store, Radio,
} from 'lucide-react';

const aiTools = [
  { to: '/ai-detection', icon: Search, title: 'AI歌曲检测', desc: '深度学习检测AI生成歌曲，准确率99%+，支持频谱分析、模式识别', color: 'from-blue-500 to-cyan-500' },
  { to: '/track-separation', icon: Music2, title: '音轨分离', desc: '基于Demucs v4模型，精准分离人声、鼓、贝斯、其他乐器', color: 'from-green-500 to-emerald-500' },
  { to: '/voice-conversion', icon: Mic2, title: 'AI转真人声', desc: 'RVC v2技术，将AI合成音色转换为自然真人声音，自然度92%+', color: 'from-purple-500 to-pink-500' },
  { to: '/voice-enhance', icon: Sparkles, title: '真人感增强', desc: 'so-vits-svc 5.0增强呼吸感、情感表达、韵律自然度', color: 'from-orange-500 to-red-500' },
];

const creationTools = [
  { to: '/ai-cover', icon: Disc3, title: 'AI翻唱', desc: '选择音色，一键翻唱任意歌曲', color: 'from-pink-500 to-rose-500' },
  { to: '/ai-singer', icon: UserCircle, title: 'AI歌手', desc: '定制AI歌手，打造专属虚拟偶像', color: 'from-indigo-500 to-purple-500' },
  { to: '/ai-dubbing', icon: Radio, title: 'AI配音', desc: '多语言AI配音，支持中英日韩', color: 'from-teal-500 to-cyan-500' },
  { to: '/ai-compose', icon: Music, title: 'AI作曲', desc: 'AI自动生成旋律、和声、编曲', color: 'from-yellow-500 to-orange-500' },
];

const videoTools = [
  { to: '/ai-mv', icon: Video, title: 'AI MV', desc: '根据音乐自动生成MV视频', color: 'from-red-500 to-pink-500' },
  { to: '/ai-short-video', icon: Clapperboard, title: 'AI短视频', desc: '一键生成抖音/快手短视频', color: 'from-violet-500 to-purple-500' },
];

const businessFeatures = [
  { to: '/enterprise', icon: Cloud, title: '企业API', desc: 'RESTful API接入，SDK多语言支持' },
  { to: '/enterprise', icon: Cpu, title: 'GPU云推理', desc: 'A100/H100集群，毫秒级响应' },
  { to: '/voice-market', icon: Store, title: '音色商城', desc: '500+精品AI音色在线选购' },
  { to: '/copyright', icon: Shield, title: '版权保护', desc: '区块链存证 + NFT铸造' },
];

export default function Home() {
  return (
    <div>
      <Hero />

      {/* AI工具 */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">AI音频</span>处理工具
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">基于前沿深度学习模型，提供专业级AI音频处理能力</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {aiTools.map((tool) => (
            <Link key={tool.to} to={tool.to} className="glass-card group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI创作 */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">AI创作</span>引擎
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">从翻唱到作曲，AI让音乐创作变得前所未有的简单</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {creationTools.map((tool) => (
            <Link key={tool.to} to={tool.to} className="glass-card group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI视频 */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">AI视频</span>生成
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">音乐到视频的一键生成，覆盖主流短视频平台</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {videoTools.map((tool) => (
            <Link key={tool.to} to={tool.to} className="glass-card group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <tool.icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 商业服务 */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">商业</span>解决方案
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">从个人创作者到企业级部署，提供全方位的AI音乐商业服务</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessFeatures.map((f) => (
            <Link key={f.to + f.title} to={f.to} className="glass-card group text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary-500/20 transition-all">
                <f.icon size={24} className="text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="glass-card glow-ring text-center !p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">准备好开始<span className="gradient-text">AI音乐创作</span>了吗？</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">免费注册即享10次AI处理额度，无需信用卡</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="gradient-btn text-lg !px-8 !py-4 flex items-center gap-2 justify-center">
                免费注册 <ArrowRight size={20} />
              </Link>
              <Link to="/enterprise" className="gradient-btn-outline text-lg !px-8 !py-4 justify-center">
                联系销售
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">核心技术栈</h2>
          <p className="text-gray-400">业界领先的AI模型与技术方案</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {['RVC v2', 'so-vits-svc', 'Demucs v4', 'MusicGen', 'SVD', 'Whisper', 'BERT', 'GPT-4o'].map((tech) => (
            <div key={tech} className="glass-card !p-4 text-center text-sm font-medium text-gray-300 hover:text-primary-400 transition-colors">
              {tech}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
