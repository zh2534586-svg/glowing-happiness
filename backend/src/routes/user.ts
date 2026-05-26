import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const userRouter = Router();

userRouter.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({
    id: user.id, email: user.email, username: user.username,
    avatar: user.avatar, role: user.role, plan: user.plan, credits: user.credits,
    createdAt: user.createdAt,
  });
});

userRouter.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { username, avatar },
  });
  res.json({ user });
});

userRouter.get('/projects', authMiddleware, async (req: AuthRequest, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ projects });
});

userRouter.get('/api-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  const keys = await prisma.apiKey.findMany({ where: { userId: req.userId } });
  res.json({ keys });
});

userRouter.post('/api-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  const key = await prisma.apiKey.create({
    data: {
      userId: req.userId!,
      key: `ak-${require('crypto').randomBytes(24).toString('hex')}`,
      name: name || 'Default',
    },
  });
  res.json({ key });
});

userRouter.get('/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  const sub = await prisma.subscription.findFirst({
    where: { userId: req.userId, status: 'active' },
    orderBy: { startDate: 'desc' },
  });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json({ subscription: sub, plan: user?.plan, credits: user?.credits });
});
