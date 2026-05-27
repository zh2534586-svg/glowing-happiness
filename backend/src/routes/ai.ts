import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import prisma from '../config/database';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import {
  generateCover,
  generateSinger,
  generateDubbing,
  generateComposition,
} from '../services/deepseek';

export const aiRouter = Router();

// AI歌曲检测
aiRouter.post('/detect', optionalAuth, async (req: AuthRequest, res: Response) => {
  const result = {
    id: uuidv4(),
    score: Math.round(Math.random() * 40 + 60),
    isAI: Math.random() > 0.5,
    details: {
      spectralAnalysis: Math.round(Math.random() * 30 + 70),
      patternRecognition: Math.round(Math.random() * 25 + 65),
      voiceArtifact: Math.round(Math.random() * 35 + 55),
    },
    processingTime: `${(Math.random() * 3 + 0.5).toFixed(1)}s`,
  };

  if (req.userId) {
    await prisma.project.create({
      data: { userId: req.userId, type: 'detection', title: 'AI歌曲检测', status: 'completed', outputUrl: JSON.stringify(result) },
    });
    await prisma.user.update({ where: { id: req.userId }, data: { credits: { decrement: 1 } } });
  }

  res.json(result);
});

// 音轨分离
aiRouter.post('/track-separation', authMiddleware, async (req: AuthRequest, res: Response) => {
  const tracks = [
    { name: 'vocals', label: '人声', url: '/uploads/demo/vocals.mp3', waveform: generateWaveform() },
    { name: 'drums', label: '鼓', url: '/uploads/demo/drums.mp3', waveform: generateWaveform() },
    { name: 'bass', label: '贝斯', url: '/uploads/demo/bass.mp3', waveform: generateWaveform() },
    { name: 'other', label: '其他乐器', url: '/uploads/demo/other.mp3', waveform: generateWaveform() },
  ];

  await prisma.project.create({
    data: { userId: req.userId!, type: 'separation', title: '音轨分离', status: 'completed', outputUrl: JSON.stringify(tracks) },
  });
  await prisma.user.update({ where: { id: req.userId }, data: { credits: { decrement: 2 } } });

  res.json({ tracks, processingTime: '3.2s', model: 'Demucs v4' });
});

// AI转真人声
aiRouter.post('/voice-conversion', authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = {
    id: uuidv4(),
    originalVoice: 'AI合成音色',
    convertedVoice: '自然人声 - 男中音',
    naturalness: 92,
    similarity: 88,
    outputUrl: '/uploads/demo/converted.wav',
    processingTime: '5.1s',
    model: 'RVC v2',
  };

  await prisma.project.create({
    data: { userId: req.userId!, type: 'voice_conversion', title: 'AI转真人声', status: 'completed', outputUrl: JSON.stringify(result) },
  });

  res.json(result);
});

// 真人感增强
aiRouter.post('/voice-enhance', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({
    id: uuidv4(),
    enhancements: {
      breathControl: 85, emotionExpress: 78, prosodyNatural: 90, timbreRichness: 82,
    },
    overallScore: 84,
    outputUrl: '/uploads/demo/enhanced.wav',
    model: 'so-vits-svc 5.0',
    processingTime: '4.3s',
  });
});

// AI翻唱
aiRouter.post('/cover', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { songTitle, voice, style } = req.body;
    const result = await generateCover({
      songTitle: songTitle || '未指定歌曲',
      targetVoice: voice || '流行女声',
      style,
    });

    const data = {
      id: uuidv4(),
      ...result,
      model: 'RVC + so-vits-svc + DeepSeek',
    };

    await prisma.project.create({
      data: { userId: req.userId!, type: 'cover', title: `翻唱: ${result.originalSong || songTitle}`, status: 'completed', outputUrl: JSON.stringify(data) },
    });
    await prisma.user.update({ where: { id: req.userId! }, data: { credits: { decrement: 3 } } });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'AI翻唱生成失败', detail: err.message });
  }
});

// AI歌手
aiRouter.post('/singer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { singer, style, description } = req.body;
    const result = await generateSinger({
      singerName: singer || 'AI歌手',
      style: style || '流行',
      description,
    });

    const data = {
      id: uuidv4(),
      ...result,
      model: 'so-vits-svc 5.0 + DeepSeek',
    };

    await prisma.project.create({
      data: { userId: req.userId!, type: 'singer', title: `AI歌手: ${result.singerName || singer}`, status: 'completed', outputUrl: JSON.stringify(data) },
    });
    await prisma.user.update({ where: { id: req.userId! }, data: { credits: { decrement: 2 } } });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'AI歌手生成失败', detail: err.message });
  }
});

// AI配音
aiRouter.post('/dubbing', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text, voice, language, speed } = req.body;
    const result = await generateDubbing({
      text: text || '这是一段AI配音示例文本。',
      voice: voice || '晓晓',
      language: language || 'zh-CN',
      speed: speed || 1.0,
    });

    const data = {
      id: uuidv4(),
      ...result,
      model: 'VITS + BERT + DeepSeek',
    };

    await prisma.project.create({
      data: { userId: req.userId!, type: 'dubbing', title: `配音: ${(text || '').slice(0, 30)}`, status: 'completed', outputUrl: JSON.stringify(data) },
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'AI配音生成失败', detail: err.message });
  }
});

// AI作曲
aiRouter.post('/compose', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { style, mood, key, bpm, theme, customLyrics, prompt, makeInstrumental } = req.body;
    const compositionId = uuidv4();

    // Step 1: Generate composition via DeepSeek
    const result = await generateComposition({
      style: style || '流行',
      mood: mood || '欢快',
      key: key || 'C Major',
      bpm: bpm || 120,
      theme: theme || prompt, // prompt serves as theme if no explicit theme
      customLyrics,
      prompt,
      makeInstrumental,
    });

    // Step 2: Generate audio (MIDI + instrumental WAV) via ai-service
    let audioUrls: Record<string, string> = {};
    try {
      const { composeAudio, synthesizeInstrumentalWav } = await import('ai-service');
      const audioResult = await composeAudio(result, compositionId);

      // Generate a simple instrumental WAV (pure math, no external tools needed)
      const instrumentalBuffer = synthesizeInstrumentalWav(result);
      const instrumentalWavPath = `/var/www/aimusic/backend/uploads/generated/${compositionId}_instrumental.wav`;
      fs.writeFileSync(instrumentalWavPath, instrumentalBuffer);

      audioUrls = {
        midiUrl: audioResult.midiUrl,
        instrumentalUrl: `/uploads/generated/${compositionId}_instrumental.wav`,
      };
    } catch (audioErr: any) {
      console.warn('Audio generation fallback — returning composition JSON only:', audioErr.message);
    }

    const data = {
      id: compositionId,
      ...result,
      audioUrls,
      model: 'DeepSeek + MIDI Synth',
    };

    await prisma.project.create({
      data: {
        userId: req.userId!,
        type: 'compose',
        title: result.title || `AI作曲 - ${style || '自定义'}`,
        status: 'completed',
        outputUrl: JSON.stringify(data),
      },
    });
    await prisma.user.update({
      where: { id: req.userId! },
      data: { credits: { decrement: 5 } },
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'AI作曲生成失败', detail: err.message });
  }
});

// AI MV
aiRouter.post('/mv', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({
    id: uuidv4(),
    title: req.body.title || 'AI生成MV',
    style: req.body.style || '梦幻',
    videoUrl: '/uploads/demo/mv.mp4',
    duration: '3:30',
    resolution: '1080p',
    scenes: 12,
    processingTime: '45.2s',
    model: 'Stable Video Diffusion',
  });
});

// AI短视频
aiRouter.post('/short-video', authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({
    id: uuidv4(),
    platform: req.body.platform || '抖音',
    videoUrl: '/uploads/demo/short_video.mp4',
    duration: '0:30',
    resolution: '1080x1920',
    hashtags: ['#AIMusic', '#AI创作', '#音乐'],
    processingTime: '18.7s',
  });
});

// 获取支持的AI模型列表
aiRouter.get('/models', (_req, res: Response) => {
  res.json({
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-Chat', type: 'llm', description: 'DeepSeek大语言模型，驱动AI作曲、配音、翻唱方案生成' },
      { id: 'rvc-v2', name: 'RVC v2', type: 'voice_conversion', description: '检索式语音转换，高质量音色克隆' },
      { id: 'so-vits-svc-5', name: 'so-vits-svc 5.0', type: 'voice_synthesis', description: '歌声合成，支持中文/日文/英文' },
      { id: 'demucs-v4', name: 'Demucs v4', type: 'separation', description: 'Meta开源音轨分离模型' },
      { id: 'musicgen', name: 'MusicGen', type: 'composition', description: 'Meta开源AI音乐生成模型' },
      { id: 'svd', name: 'Stable Video Diffusion', type: 'video', description: 'AI视频生成模型' },
    ],
  });
});

function generateWaveform(): number[] {
  return Array.from({ length: 100 }, () => Math.round(Math.random() * 100));
}
