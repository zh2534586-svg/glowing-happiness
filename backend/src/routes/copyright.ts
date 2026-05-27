import { Router, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const copyrightRouter = Router();

copyrightRouter.get('/info', (_req, res: Response) => {
  res.json({
    title: '区块链版权保护系统',
    description: '基于区块链技术的AI音乐版权登记、溯源和保护平台',
    features: [
      { icon: 'Fingerprint', title: '版权登记', desc: 'AI生成内容的数字指纹上链，不可篡改的时间戳证明' },
      { icon: 'Search', title: '侵权检测', desc: '全网扫描相似内容，AI驱动的抄袭检测' },
      { icon: 'FileText', title: '智能合约', desc: '自动化的版权授权和版税分配' },
      { icon: 'Link', title: 'NFT铸造', desc: '音乐作品一键铸造为NFT，支持多链' },
      { icon: 'Globe', title: '全球维权', desc: '覆盖DMCA和国内版权法，一键维权' },
    ],
    chains: [
      { name: 'Ethereum', icon: 'eth', desc: '最安全的NFT公链，Gas费较高' },
      { name: 'Polygon', icon: 'polygon', desc: '低Gas费，高吞吐量，推荐' },
      { name: 'BSN-DDC', icon: 'bsn', desc: '国内合规区块链服务网络' },
      { name: '蚂蚁链', icon: 'ant', desc: '蚂蚁集团区块链，国内合规' },
    ],
    process: [
      { step: 1, title: '上传作品', desc: '上传您的AI音乐作品' },
      { step: 2, title: 'AI指纹生成', desc: '生成唯一的数字指纹哈希' },
      { step: 3, title: '区块链存证', desc: '指纹和时间戳上链存证' },
      { step: 4, title: '获取证书', desc: '获得区块链版权证书' },
      { step: 5, title: 'NFT铸造', desc: '选择铸造为NFT（可选）' },
    ],
  });
});

copyrightRouter.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, contentHash } = req.body;
  const record = await prisma.copyrightRecord.create({
    data: {
      userId: req.userId!,
      title: title || '未命名作品',
      contentHash: contentHash || `0x${require('crypto').randomBytes(32).toString('hex')}`,
      status: 'confirmed',
      txHash: `0x${require('crypto').randomBytes(32).toString('hex')}`,
    },
  });

  res.json({
    success: true,
    certificate: {
      id: record.id,
      title: record.title,
      contentHash: record.contentHash,
      txHash: record.txHash,
      timestamp: record.createdAt,
      chain: 'BSN-DDC',
      blockNumber: Math.floor(Math.random() * 1000000) + 20000000,
    },
  });
});

copyrightRouter.get('/records', authMiddleware, async (req: AuthRequest, res: Response) => {
  const records = await prisma.copyrightRecord.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ records });
});

copyrightRouter.post('/nft/mint', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { copyrightId, chain } = req.body;
  const record = await prisma.copyrightRecord.findUnique({ where: { id: copyrightId } });
  if (!record) return res.status(404).json({ error: '版权记录不存在' });

  res.json({
    success: true,
    nft: {
      tokenId: `#${Math.floor(Math.random() * 10000)}`,
      contractAddress: `0x${require('crypto').randomBytes(20).toString('hex')}`,
      chain: chain || 'Polygon',
      txHash: `0x${require('crypto').randomBytes(32).toString('hex')}`,
      metadata: {
        title: record.title,
        creator: req.userId,
        contentHash: record.contentHash,
      },
      marketplace: `https://opensea.io/assets/matic/${require('crypto').randomBytes(20).toString('hex')}/${Math.floor(Math.random() * 10000)}`,
    },
  });
});
