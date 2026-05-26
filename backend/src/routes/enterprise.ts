import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const enterpriseRouter = Router();

enterpriseRouter.get('/info', (_req, res: Response) => {
  res.json({
    title: '企业级AI音乐解决方案',
    description: '为您的企业提供全套AI音乐能力，支持API接入、SaaS订阅、GPU云推理和私有化部署',
    features: [
      { icon: 'Cloud', title: 'API接入', desc: 'RESTful API，SDK支持多语言，快速集成AI音乐能力到您的产品' },
      { icon: 'Server', title: 'SaaS订阅', desc: '按需付费，弹性扩容，无需运维GPU集群' },
      { icon: 'Cpu', title: 'GPU云推理', desc: '自建GPU集群，A100/H100可用，毫秒级响应' },
      { icon: 'Shield', title: '私有化部署', desc: 'Docker/K8s部署，支持国产GPU，数据不出企业内网' },
      { icon: 'Headphones', title: '定制音色', desc: '为企业打造专属AI音色，品牌声音识别' },
      { icon: 'Clock', title: '7x24技术支持', desc: '专属技术团队，SLA 99.9%保障' },
    ],
    pricing: {
      saas: { name: 'SaaS标准版', price: '¥4,999/月', features: ['API 10万次调用', '5个并发', '标准音色库', '邮件支持'] },
      dedicated: { name: '专属集群版', price: '¥29,999/月', features: ['API 100万次调用', '50个并发', '全音色库 + 定制', '7x24电话支持', 'GPU专属资源'] },
      private: { name: '私有化部署', price: '联系销售', features: ['无限调用', '内网部署', '定制开发', '源码级支持', 'SLA 99.99%'] },
    },
    specs: {
      gpu: ['NVIDIA A100 80GB', 'NVIDIA H100', '华为昇腾910B'],
      latency: '< 500ms (首字延迟)',
      throughput: '1000+ QPS (集群模式)',
      availability: '99.9%',
    },
  });
});

enterpriseRouter.post('/contact', async (req, res: Response) => {
  const { company, name, phone, email, requirement } = req.body;
  res.json({
    success: true,
    message: '感谢您的咨询，我们的销售团队将在24小时内与您联系',
    record: { company, name, phone, email, requirement },
  });
});

enterpriseRouter.get('/docs', (_req, res: Response) => {
  res.json({
    title: 'API文档',
    version: 'v2.0.0',
    baseUrl: 'https://api.aimusic.com/v2',
    authentication: 'Bearer Token (API Key)',
    endpoints: [
      { method: 'POST', path: '/ai/detect', desc: 'AI歌曲检测', rateLimit: '100/min' },
      { method: 'POST', path: '/ai/separate', desc: '音轨分离', rateLimit: '30/min' },
      { method: 'POST', path: '/ai/convert-voice', desc: 'AI转真人声', rateLimit: '50/min' },
      { method: 'POST', path: '/ai/enhance', desc: '真人感增强', rateLimit: '50/min' },
      { method: 'POST', path: '/ai/cover', desc: 'AI翻唱', rateLimit: '20/min' },
      { method: 'POST', path: '/ai/compose', desc: 'AI作曲', rateLimit: '20/min' },
      { method: 'POST', path: '/ai/mv', desc: 'AI MV生成', rateLimit: '5/min' },
    ],
    sdks: [
      { language: 'Python', install: 'pip install aimusic-sdk' },
      { language: 'JavaScript', install: 'npm install aimusic-sdk' },
      { language: 'Java', install: 'maven: com.aimusic/sdk' },
      { language: 'Go', install: 'go get github.com/aimusic/sdk' },
    ],
  });
});
