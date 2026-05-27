import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const paymentRouter = Router();

const PLANS: Record<string, { name: string; price: number; credits: number; duration: number }> = {
  basic: { name: '基础版', price: 29.9, credits: 100, duration: 30 },
  pro: { name: '专业版', price: 99.9, credits: 500, duration: 30 },
  enterprise: { name: '企业版', price: 499.9, credits: 5000, duration: 30 },
};

paymentRouter.get('/plans', (_req, res: Response) => {
  res.json({
    plans: [
      { id: 'free', name: '免费版', price: 0, credits: 10, features: ['AI歌曲检测 x3/月', '音轨分离 x1/月', '基础音色'] },
      { id: 'basic', name: '基础版', price: 29.9, credits: 100, features: ['AI歌曲检测 x50/月', '音轨分离 x20/月', 'AI翻唱 x10/月', '标准音色库'] },
      { id: 'pro', name: '专业版', price: 99.9, credits: 500, features: ['全部AI功能无限', 'AI作曲 x50/月', 'AI MV x10/月', '全音色库', 'API访问'] },
      { id: 'enterprise', name: '企业版', price: 499.9, credits: 5000, features: ['全部功能无限', '专属GPU集群', '私有化部署', '定制音色', '7x24技术支持', 'SLA保障'] },
    ],
  });
});

paymentRouter.post('/create-order', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { planId, method } = req.body;
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ error: '无效的套餐' });

  const orderNo = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      userId: req.userId!,
      amount: plan.price,
      method: method || 'wechat',
      orderNo,
      description: `购买${plan.name}`,
    },
  });

  res.json({
    orderNo: payment.orderNo,
    amount: payment.amount,
    qrcode: method === 'wechat' ? `wechat://pay/${orderNo}` : method === 'alipay' ? `alipay://pay/${orderNo}` : null,
    paymentUrl: `/payment/checkout?orderNo=${orderNo}`,
  });
});

paymentRouter.post('/callback', async (req: Request, res: Response) => {
  const { orderNo, status } = req.body;
  const payment = await prisma.payment.update({
    where: { orderNo },
    data: { status },
  });

  if (status === 'success') {
    const plan = Object.entries(PLANS).find(([_, p]) => p.price === payment.amount);
    if (plan) {
      const [planId, planInfo] = plan;
      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: planId, credits: { increment: planInfo.credits } },
      });
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: planId,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + planInfo.duration * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  res.json({ success: true });
});

// 微信支付配置接口
paymentRouter.get('/wechat-config', (_req: Request, res: Response) => {
  res.json({
    appId: 'wx_app_id_placeholder',
    mchId: 'mch_id_placeholder',
    notifyUrl: '/api/payment/callback',
  });
});

// 支付宝支付配置接口
paymentRouter.get('/alipay-config', (_req: Request, res: Response) => {
  res.json({
    appId: 'alipay_app_id_placeholder',
    notifyUrl: '/api/payment/callback',
  });
});

