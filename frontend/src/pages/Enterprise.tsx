import { useState } from 'react';
import { Cloud, Server, Cpu, Shield, Headphones, Clock, Check, ArrowRight, Code, Terminal } from 'lucide-react';
import api from '../api/client';

const features = [
  { icon: Cloud, title: 'API接入', desc: 'RESTful API，多语言SDK，快速集成AI音乐能力' },
  { icon: Server, title: 'SaaS订阅', desc: '按需付费，弹性扩容，无需运维GPU集群' },
  { icon: Cpu, title: 'GPU云推理', desc: '自建A100/H100集群，毫秒级响应' },
  { icon: Shield, title: '私有化部署', desc: 'Docker/K8s部署，支持国产GPU' },
  { icon: Headphones, title: '定制音色', desc: '为企业打造专属AI音色IP' },
  { icon: Clock, title: '7x24技术支持', desc: '专属技术团队，SLA 99.9%' },
];

const plans = [
  { name: 'SaaS标准版', price: '¥4,999', period: '/月', fts: ['API 10万次调用/月', '5个并发', '标准音色库', '邮件支持', '99.5% SLA'], highlight: false },
  { name: '专属集群版', price: '¥29,999', period: '/月', fts: ['API 100万次调用/月', '50个并发', '全音色库 + 定制', '7x24电话支持', 'GPU专属资源', '99.9% SLA'], highlight: true },
  { name: '私有化部署', price: '联系销售', period: '', fts: ['无限调用', '内网部署', '定制开发', '源码级支持', '国产GPU适配', '99.99% SLA'], highlight: false },
];

export default function Enterprise() {
  const [form, setForm] = useState({ company: '', name: '', phone: '', email: '', requirement: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/enterprise/contact', form); } catch {}
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4">企业级<span className="gradient-text">AI音乐</span>解决方案</h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">为您的企业提供全套AI音乐能力，支持API接入、SaaS订阅、GPU云推理和私有化部署</p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((f) => (
            <div key={f.title} className="glass-card">
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                <f.icon size={24} className="text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* GPU Specs */}
        <div className="glass-card glow-ring !p-8 mb-20 text-center">
          <h2 className="text-2xl font-bold mb-6">GPU推理集群规格</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'GPU型号', value: 'A100 / H100 / 昇腾910B' },
              { label: '首字延迟', value: '< 500ms' },
              { label: '吞吐量', value: '1000+ QPS' },
              { label: '可用性', value: '99.9%' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-sm text-gray-400 mb-1">{s.label}</div>
                <div className="font-semibold text-primary-400">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-10">企业套餐</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`glass-card relative ${plan.highlight ? 'border-primary-500 glow-ring' : ''}`}>
                {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-500 text-white text-xs font-medium">推荐</div>}
                <h3 className="font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4"><span className="text-3xl font-bold gradient-text">{plan.price}</span><span className="text-gray-500">{plan.period}</span></div>
                <ul className="space-y-2 mb-6">
                  {plan.fts.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400"><Check size={14} className="text-green-400 flex-shrink-0" />{f}</li>
                  ))}
                </ul>
                <button className={plan.highlight ? 'gradient-btn w-full' : 'gradient-btn-outline w-full'}>
                  {plan.name === '私有化部署' ? '联系销售' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SDK */}
        <div className="glass-card !p-8 mb-20">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Code size={20} className="text-primary-400" />SDK 快速接入</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { lang: 'Python', cmd: 'pip install aimusic-sdk' },
              { lang: 'JavaScript', cmd: 'npm install aimusic-sdk' },
              { lang: 'Java', cmd: 'maven: com.aimusic/sdk' },
              { lang: 'Go', cmd: 'go get github.com/aimusic/sdk' },
            ].map((sdk) => (
              <div key={sdk.lang} className="glass p-4 rounded-xl text-center">
                <Terminal size={20} className="text-primary-400 mx-auto mb-2" />
                <div className="font-medium text-sm mb-1">{sdk.lang}</div>
                <code className="text-xs text-gray-400 bg-dark-100 px-2 py-1 rounded">{sdk.cmd}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">联系销售团队</h2>
          {submitted ? (
            <div className="glass-card text-center !p-10">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">提交成功！</h3>
              <p className="text-gray-400">我们的销售团队将在24小时内与您联系</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card !p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">公司名称 *</label><input required value={form.company} onChange={(e) => setForm({...form, company: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">联系人 *</label><input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-400 mb-1">手机号 *</label><input required type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="input-field" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">邮箱 *</label><input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="input-field" /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">需求描述</label><textarea value={form.requirement} onChange={(e) => setForm({...form, requirement: e.target.value})} className="input-field h-24 resize-none" placeholder="请描述您的需求..." /></div>
              <button type="submit" className="gradient-btn w-full flex items-center justify-center gap-2">提交咨询 <ArrowRight size={18} /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
