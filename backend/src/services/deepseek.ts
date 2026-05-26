import OpenAI from 'openai';

// Polyfill Web APIs for Node.js < 18 (CentOS 7 compatibility)
if (!globalThis.fetch) {
  const nodeFetch = require('node-fetch');
  (globalThis as any).fetch = nodeFetch;
  (globalThis as any).Headers = nodeFetch.Headers;
  (globalThis as any).Request = nodeFetch.Request;
  (globalThis as any).Response = nodeFetch.Response;
  // Minimal FormData/Blob/File polyfills for openai package (not used for chat)
  if (!(globalThis as any).FormData) {
    (globalThis as any).FormData = class FormData {};
  }
  if (!(globalThis as any).Blob) {
    (globalThis as any).Blob = class Blob {};
  }
  if (!(globalThis as any).File) {
    (globalThis as any).File = class File {};
  }
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-75fcca6416fe4c20b0a2855a055254b6',
  baseURL: 'https://api.deepseek.com',
});

const CHAT_MODEL = 'deepseek-chat';

export interface CoverParams {
  songTitle: string;
  targetVoice: string;
  style?: string;
}

export interface SingerParams {
  singerName: string;
  style: string;
  description?: string;
}

export interface DubbingParams {
  text: string;
  voice: string;
  language: string;
  speed: number;
  emotion?: string;
}

export interface ComposeParams {
  style: string;
  mood: string;
  key: string;
  bpm: number;
  theme?: string;
}

export async function generateCover(params: CoverParams) {
  const prompt = `你是一位专业音乐制作人。请根据以下信息为AI翻唱生成详细的翻唱方案：

原唱歌曲: ${params.songTitle}
目标音色: ${params.targetVoice}
${params.style ? `风格偏好: ${params.style}` : ''}

请以JSON格式返回:
{
  "originalSong": "原唱歌曲名",
  "coverVoice": "目标音色",
  "pitchShift": "推荐变调（如+2 semitones）",
  "tempoAdjust": "推荐变速（如-5 BPM）",
  "arrangement": "编曲调整建议（50字以内）",
  "vocalEffects": ["效果1", "效果2", "效果3"],
  "estimatedQuality": "预计质量评分（60-100）",
  "processingTime": "预计处理时间"
}`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateSinger(params: SingerParams) {
  const prompt = `你是一位AI声音设计师。请为以下AI虚拟歌手生成详细的声线方案：

歌手名: ${params.singerName}
风格: ${params.style}
${params.description ? `补充描述: ${params.description}` : ''}

请以JSON格式返回:
{
  "singerName": "歌手名",
  "voiceModel": "音色模型标识",
  "range": "音域范围（如C3-C6）",
  "timbre": "音色特点描述（30字以内）",
  "styles": ["擅长风格1", "擅长风格2", "擅长风格3", "擅长风格4"],
  "recommendedSongs": ["推荐曲目1", "推荐曲目2"],
  "voiceParams": {
    "breathiness": "(0-100)气声比例",
    "brightness": "(0-100)明亮度",
    "vibrato": "(0-100)颤音深度",
    "attack": "(0-100)起音速度"
  },
  "processingTime": "预计处理时间"
}`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateDubbing(params: DubbingParams) {
  const prompt = `你是一位专业配音导演。请为以下配音任务生成配音方案：

文本内容: ${params.text}
配音音色: ${params.voice}
语言: ${params.language}
语速: ${params.speed}x
${params.emotion ? `情感: ${params.emotion}` : ''}

请以JSON格式返回:
{
  "text": "配音文本",
  "voice": "使用音色",
  "language": "语言代码",
  "speed": 语速倍数,
  "duration": "预计时长",
  "emotion": "情感标注",
  "pronunciationNotes": "发音注意事项（如多音字、语调）",
  "ssml": "SSML标记文本（可选，用于精细控制）",
  "quality": "合成质量评估"
}`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function generateComposition(params: ComposeParams) {
  const prompt = `你是一位专业AI作曲家。请根据以下参数创作一首原创音乐作品：

风格: ${params.style}
情绪: ${params.mood}
调性: ${params.key}
BPM: ${params.bpm}
${params.theme ? `主题: ${params.theme}` : ''}

请以JSON格式返回:
{
  "title": "曲目标题（有创意的中文名）",
  "style": "音乐风格",
  "mood": "情绪",
  "bpm": BPM数值,
  "key": "调性",
  "structure": ["段落1", "段落2", "段落3", "段落4", "段落5", "段落6"],
  "chordProgression": ["和弦1", "和弦2", "和弦3", "和弦4"],
  "melodyDescription": "旋律特征描述（80字以内）",
  "instrumentation": ["乐器1", "乐器2", "乐器3", "乐器4"],
  "lyrics": "一段8-12句的原创歌词",
  "arrangementTips": "编曲建议（50字以内）",
  "processingTime": "预计处理时间"
}`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
