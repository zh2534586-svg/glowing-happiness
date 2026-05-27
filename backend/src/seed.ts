import prisma from './config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  await prisma.user.upsert({
    where: { email: 'demo@aimusic.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'demo@aimusic.com',
      username: 'demo',
      password: hashedPassword,
      role: 'user',
      plan: 'free',
      credits: 50,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@aimusic.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'admin@aimusic.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      plan: 'enterprise',
      credits: 9999,
    },
  });

  const voices = [
    { name: '天后 - 流行女声', category: '流行', price: 0, rating: 4.8, downloads: 12500, description: '适合流行歌曲翻唱，音域宽广', seller: '官方' },
    { name: '摇滚男声 - 烈火', category: '摇滚', price: 29.9, rating: 4.6, downloads: 8900, description: '金属质感，适合摇滚/金属风格', seller: 'RockVoice Studio' },
    { name: '古风女声 - 清韵', category: '古风', price: 19.9, rating: 4.9, downloads: 15600, description: '古典韵味，适合古风/国风歌曲', seller: '官方' },
    { name: 'R&B男声 - Soul', category: 'R&B', price: 39.9, rating: 4.5, downloads: 6700, description: '丝滑转音，R&B风格首选', seller: 'SoulVoice' },
    { name: '二次元萌音', category: '二次元', price: 9.9, rating: 4.7, downloads: 23000, description: 'ACG风格，元气满满', seller: 'AnimeVoice' },
    { name: '民谣男声 - 远行', category: '民谣', price: 0, rating: 4.4, downloads: 5400, description: '温暖磁性的民谣嗓音', seller: '官方' },
    { name: '电音女声 - Neon', category: '电子', price: 49.9, rating: 4.3, downloads: 4500, description: '未来感电音人声', seller: 'NeonBeats' },
    { name: '爵士女声 - Ella', category: '爵士', price: 59.9, rating: 4.8, downloads: 3200, description: '醇厚爵士嗓音，慵懒迷人', seller: 'JazzVoice' },
  ];

  for (const voice of voices) {
    await prisma.voiceModel.upsert({
      where: { id: `seed-${voice.name}` },
      update: {},
      create: { id: `seed-${voice.name}`, ...voice },
    });
  }

  console.log('Seed completed!');
  console.log('Demo accounts:');
  console.log('  User: demo@aimusic.com / demo123');
  console.log('  Admin: admin@aimusic.com / demo123');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
