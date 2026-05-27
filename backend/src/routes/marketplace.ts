import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const marketplaceRouter = Router();

marketplaceRouter.get('/voices', async (_req, res: Response) => {
  const voices = await prisma.voiceModel.findMany({ orderBy: { downloads: 'desc' } });
  if (voices.length === 0) {
    const defaultVoices = [
      { id: 'v1', name: '天后 - 流行女声', category: '流行', price: 0, rating: 4.8, downloads: 12500, description: '适合流行歌曲翻唱，音域宽广', seller: '官方', previewUrl: '/demo/voice1.mp3' },
      { id: 'v2', name: '摇滚男声 - 烈火', category: '摇滚', price: 29.9, rating: 4.6, downloads: 8900, description: '金属质感，适合摇滚/金属风格', seller: 'RockVoice Studio', previewUrl: '/demo/voice2.mp3' },
      { id: 'v3', name: '古风女声 - 清韵', category: '古风', price: 19.9, rating: 4.9, downloads: 15600, description: '古典韵味，适合古风/国风歌曲', seller: '官方', previewUrl: '/demo/voice3.mp3' },
      { id: 'v4', name: 'R&B男声 - Soul', category: 'R&B', price: 39.9, rating: 4.5, downloads: 6700, description: '丝滑转音，R&B风格首选', seller: 'SoulVoice', previewUrl: '/demo/voice4.mp3' },
      { id: 'v5', name: '二次元萌音', category: '二次元', price: 9.9, rating: 4.7, downloads: 23000, description: 'ACG风格，元气满满', seller: 'AnimeVoice', previewUrl: '/demo/voice5.mp3' },
      { id: 'v6', name: '民谣男声 - 远行', category: '民谣', price: 0, rating: 4.4, downloads: 5400, description: '温暖磁性的民谣嗓音', seller: '官方', previewUrl: '/demo/voice6.mp3' },
      { id: 'v7', name: '电音女声 - Neon', category: '电子', price: 49.9, rating: 4.3, downloads: 4500, description: '未来感电音人声', seller: 'NeonBeats', previewUrl: '/demo/voice7.mp3' },
      { id: 'v8', name: '爵士女声 - Ella', category: '爵士', price: 59.9, rating: 4.8, downloads: 3200, description: '醇厚爵士嗓音，慵懒迷人', seller: 'JazzVoice', previewUrl: '/demo/voice8.mp3' },
    ];
    await prisma.voiceModel.createMany({ data: defaultVoices.map(v => ({ ...v, id: undefined })) });
    return res.json({ voices: defaultVoices });
  }
  res.json({ voices });
});

marketplaceRouter.get('/voices/:id', async (req, res: Response) => {
  const voice = await prisma.voiceModel.findUnique({ where: { id: req.params.id } });
  if (!voice) return res.status(404).json({ error: '音色不存在' });
  res.json({ voice });
});

marketplaceRouter.post('/purchase/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const voice = await prisma.voiceModel.findUnique({ where: { id: req.params.id } });
  if (!voice) return res.status(404).json({ error: '音色不存在' });

  await prisma.voiceModel.update({ where: { id: voice.id }, data: { downloads: { increment: 1 } } });
  res.json({ success: true, message: `成功购买音色「${voice.name}」`, voice });
});

marketplaceRouter.get('/categories', (_req, res: Response) => {
  res.json({
    categories: ['全部', '流行', '摇滚', '古风', 'R&B', '二次元', '民谣', '电子', '爵士', '嘻哈', '古典'],
  });
});
