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
  const lyricsInstruction = params.customLyrics
    ? `使用以下用户提供的歌词进行创作，不要修改歌词内容：
---
${params.customLyrics}
---

lyrics字段必须完整保留用户提供的歌词原文。`
    : `lyrics字段返回一段8-12句的原创歌词，每句用换行分隔。`;

  const prompt = `你是一位专业AI作曲家。请根据以下参数创作一首原创音乐作品：

风格: ${params.style}
情绪: ${params.mood}
调性: ${params.key}
BPM: ${params.bpm}
${params.theme ? `主题/灵感: ${params.theme}` : ''}

请以JSON格式返回:
{
  "title": "曲目标题（有创意的中文名）",
  "style": "音乐风格描述（如'流行摇滚''中国风电子'等，10字以内）",
  "mood": "情绪",
  "bpm": BPM数值,
  "key": "调性",
  "structure": ["段落1", "段落2", "段落3", "段落4", "段落5", "段落6"],
  "chordProgression": ["和弦1", "和弦2", "和弦3", "和弦4", "和弦5", "和弦6", "和弦7", "和弦8"],
  "melodyDescription": "旋律特征描述（80字以内）",
  "instrumentation": ["乐器1", "乐器2", "乐器3", "乐器4", "乐器5"],
  ${params.customLyrics ? '' : '"lyrics": "一段8-12句的原创歌词，每句用换行分隔",'}
  "melody": [
    {"note": "C4", "syllable": "歌", "duration": 1},
    {"note": "D4", "syllable": "词", "duration": 1},
    {"note": "E4", "syllable": "第", "duration": 0.5},
    ...
  ],
  "songStructure": "完整歌曲结构说明（如：前奏4小节→主歌A 8小节→副歌8小节→间奏→主歌B→副歌×2→尾奏）",
  "arrangementTips": "编曲建议（50字以内）",
  "processingTime": "预计处理时间"
}

${lyricsInstruction}

重要要求：
- ${params.customLyrics ? 'melody数组的每个元素对应lyrics中的每个字（不含标点），syllable即为该字' : 'melody数组的每个元素对应lyrics中的一个字（不含标点符号），syllable就是那个字'}
- note使用国际音名（C D E F G A B）+ 八度数字（3-5），确保旋律在C3-B5范围内
- duration是时值：1=四分音符, 0.5=八分音符, 2=二分音符, 0.25=十六分音符
- 旋律要有起伏变化，符合${params.style}风格和${params.mood}情绪
- 每个字都必须有对应的音符，一字一音
- ${params.customLyrics ? 'melody数组长度必须等于去除标点后的lyrics总字数' : '确保melody数组长度与去除标点后的lyrics字数一致'}
- style字段返回更具体、有创意的风格描述，不要只重复输入参数`;

  const response = await deepseek.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}
