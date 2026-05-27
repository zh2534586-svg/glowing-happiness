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
  customLyrics?: string;
  prompt?: string;       // Free-text prompt describing the desired song
  makeInstrumental?: boolean; // Generate instrumental-only version
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
  const baseStyle = params.style || '流行';
  const baseMood = params.mood || '欢快';

  // Build a Suno-like creative prompt
  const creativeContext = params.prompt
    ? `用户创作需求: "${params.prompt}"

请根据用户的文字描述自由创作。上述风格(${baseStyle})和情绪(${baseMood})仅作参考，优先满足用户的文字描述。`
    : `风格: ${baseStyle}
情绪: ${baseMood}`;

  const lyricsInstruction = params.customLyrics
    ? `使用以下用户提供的歌词进行创作，不要修改歌词内容：
---
${params.customLyrics}
---

lyrics字段必须完整保留用户提供的歌词原文。`
    : `lyrics字段返回一段12-16句的原创中文歌词，每句用换行分隔。歌词要富有诗意和画面感，符合歌曲主题。`;

  const prompt = `你是一位获得格莱美奖的专业AI音乐创作人。请根据以下要求创作一首完整的原创歌曲：

${creativeContext}
调性: ${params.key || 'C Major'}
BPM: ${params.bpm || 120}
${params.theme ? `主题/灵感: ${params.theme}` : ''}

请以JSON格式返回一首完整的歌曲作品:
{
  "title": "曲目标题（富有创意和吸引力的中文歌名）",
  "style": "具体的音乐风格描述（如'梦幻流行摇滚''古风电音''都市R&B抒情'等，不要只重复输入参数）",
  "mood": "歌曲情绪氛围",
  "bpm": BPM数值,
  "key": "调性",
  "structure": ["前奏4小节", "主歌A 8小节", "预副歌4小节", "副歌8小节", "间奏4小节", "主歌B 8小节", "副歌8小节", "尾奏4小节"],
  "chordProgression": ["C", "G", "Am", "F", "C", "G", "F", "C"],
  "melodyDescription": "旋律特征描述：描述主旋律的走向、音程特点、节奏型态、高潮处理等（80字以内）",
  "instrumentation": ["钢琴", "电吉他", "合成器", "贝斯", "鼓"],
  "lyrics": "12-16句原创中文歌词，每句用换行分隔，有verse/chorus/bridge结构标记",
  "melody": [
    {"note": "C4", "syllable": "歌", "duration": 1},
    {"note": "D4", "syllable": "词", "duration": 1},
    ...
  ],
  "songStructure": "完整的歌曲段落结构说明，标注每个段落的情绪变化和动态起伏",
  "arrangementTips": "编曲建议：包括配器层次、节奏变化、高潮处理（60字以内）",
  "genreTags": ["标签1", "标签2", "标签3"],
  "processingTime": "预计处理时间"
}

${lyricsInstruction}

严格要求：
- melody数组的每个元素对应lyrics中的一个字（不含标点符号和空格），syllable必须等于该字
- note使用国际音名（C D E F G A B）+ 八度数字（3-5），确保旋律在合理人声范围内(C3-B5)
- duration是时值：1=四分音符, 0.5=八分音符, 2=二分音符, 0.25=十六分音符, 1.5=附点四分音符
- 旋律要有明显的起伏和高潮：主歌较低沉平稳，副歌升高展开，bridge可以变化调式
- 每个字都必须有对应的音符，一字一音，melody数组长度必须等于去除标点后的lyrics总字数
- chordProgression要包含8-12个和弦，形成完整的和声进行
- 主歌和副歌要有明显的旋律对比
- 歌词要有完整的verse-chorus-bridge结构`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
