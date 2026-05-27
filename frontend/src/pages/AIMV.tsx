import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Zap, Download, Video, Music, Camera, User } from 'lucide-react';
import ToolPage from '../components/ToolPage';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

const styles = ['梦幻', '赛博朋克', '复古', '极简', '动漫', '水墨'];

type Mode = 'webcam' | 'avatar';

// ==== Avatar character drawing with lip-sync ====
function drawAvatar(
  ctx: CanvasRenderingContext2D, w: number, h: number, t: number,
  freqData: Uint8Array, bufLen: number, cfg: any,
) {
  // Background
  cfg.bgDraw(ctx, w, h, t);

  const cx = w / 2;
  const cy = h * 0.4;

  // Audio-driven animation params
  const bassAvg = freqData.slice(0, 8).reduce((a: number, b: number) => a + b, 0) / (8 * 255);
  const midAvg = freqData.slice(8, 32).reduce((a: number, b: number) => a + b, 0) / (24 * 255);
  const mouthOpen = bassAvg * 0.6 + midAvg * 0.3;
  const bodyBob = Math.sin(t * 1.5) * bassAvg * 15;

  ctx.save();
  ctx.translate(0, bodyBob);

  // Body
  const bodyY = cy + h * 0.18;
  const shoulderW = w * 0.22;
  // Shoulders
  ctx.fillStyle = cfg.bodyColor;
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, h);
  ctx.quadraticCurveTo(cx - shoulderW * 0.7, bodyY + 20, cx - w * 0.04, bodyY + 5);
  ctx.lineTo(cx + w * 0.04, bodyY + 5);
  ctx.quadraticCurveTo(cx + shoulderW * 0.7, bodyY + 20, cx + shoulderW, h);
  ctx.closePath();
  ctx.fill();

  // Neck
  ctx.fillStyle = cfg.skinColor;
  ctx.fillRect(cx - w * 0.02, bodyY - h * 0.03, w * 0.04, h * 0.08);

  // Head
  const headR = w * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, headR, 0, Math.PI * 2);
  ctx.fillStyle = cfg.skinColor;
  ctx.fill();

  // Hair
  ctx.beginPath();
  ctx.arc(cx, cy - headR * 0.25, headR * 1.08, Math.PI, 0);
  ctx.fillStyle = cfg.hairColor;
  ctx.fill();

  // Eyes
  const eyeY = cy - headR * 0.15;
  const eyeSpacing = headR * 0.4;
  [-1, 1].forEach((side) => {
    // Eye white
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx + side * eyeSpacing, eyeY, headR * 0.2, headR * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(cx + side * eyeSpacing + side * 2, eyeY + bassAvg * 3, headR * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Blink occasionally
    if (Math.sin(t * 4) > 0.92) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + side * eyeSpacing - headR * 0.18, eyeY);
      ctx.lineTo(cx + side * eyeSpacing + headR * 0.18, eyeY);
      ctx.stroke();
    }
  });

  // Eyebrows
  [-1, 1].forEach((side) => {
    ctx.strokeStyle = cfg.hairColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const bx = cx + side * eyeSpacing;
    const by = eyeY - headR * 0.3;
    ctx.moveTo(bx - headR * 0.25, by + side * 2 - midAvg * 6);
    ctx.quadraticCurveTo(bx, by - midAvg * 8, bx + headR * 0.25, by - side * 2 - midAvg * 4);
    ctx.stroke();
  });

  // Mouth (lip-sync: opens based on audio amplitude)
  const mouthY = cy + headR * 0.35;
  const mouthW = headR * 0.35 + mouthOpen * headR * 0.25;
  const mouthH = headR * 0.08 + mouthOpen * headR * 0.35;

  ctx.fillStyle = '#c44';
  ctx.beginPath();
  ctx.ellipse(cx, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
  ctx.fill();

  // Upper lip line
  ctx.strokeStyle = '#a33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - mouthW * 0.8, mouthY);
  ctx.quadraticCurveTo(cx, mouthY - mouthH * 0.3, cx + mouthW * 0.8, mouthY);
  ctx.stroke();

  // Blush
  [-1, 1].forEach((side) => {
    const blushX = cx + side * headR * 0.7;
    const blushY = cy + headR * 0.15;
    const blushGrad = ctx.createRadialGradient(blushX, blushY, 0, blushX, blushY, headR * 0.25);
    blushGrad.addColorStop(0, 'rgba(255,150,150,0.25)');
    blushGrad.addColorStop(1, 'rgba(255,150,150,0)');
    ctx.fillStyle = blushGrad;
    ctx.beginPath();
    ctx.arc(blushX, blushY, headR * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // Floating music notes
  for (let i = 0; i < 6; i++) {
    const nx = cx - w * 0.3 + (w * 0.6 * ((t * 30 + i * 100) % 600) / 600);
    const ny = h * 0.1 + Math.sin(t * 2 + i) * 30;
    ctx.fillStyle = cfg.glowColor;
    ctx.globalAlpha = 0.3 + bassAvg * 0.4;
    ctx.font = `${16 + i * 4}px sans-serif`;
    ctx.fillText(['♩', '♪', '♫', '♬'][i % 4], nx, ny);
  }
  ctx.globalAlpha = 1;

  // Title
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `${Math.floor(w * 0.035)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = cfg.glowColor;
  ctx.shadowBlur = 6;
  ctx.fillText('AI 歌手演唱中...', cx, h * 0.92);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
}

// Style configs (with avatar colors)
const cfgs: Record<string, any> = {
  '梦幻': {
    barColor: '#c084fc', barColor2: '#e879f9', glowColor: '#d8b4fe', particle: '#f0abfc',
    skinColor: '#ffe4d0', hairColor: '#4a1942', bodyColor: '#7c3aed',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1a0030'); grad.addColorStop(0.5, '#0d0020'); grad.addColorStop(1, '#0a0010');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        const x = w * 0.2 * i + Math.sin(t * 0.3 + i) * 60;
        const y = h * 0.3 + Math.cos(t * 0.5 + i) * 80;
        const r = 40 + Math.sin(t + i * 2) * 15;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(192,132,252,0.12)'); g.addColorStop(1, 'rgba(192,132,252,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  '赛博朋克': {
    barColor: '#06b6d4', barColor2: '#00ff88', glowColor: '#22d3ee', particle: '#34d399',
    skinColor: '#f5e6d3', hairColor: '#1a1a2e', bodyColor: '#0f3460',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.fillStyle = '#000a0f'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(6,182,212,0.08)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y + ((t * 20) % 40)); ctx.lineTo(w, y + ((t * 20) % 40)); ctx.stroke(); }
    },
  },
  '复古': {
    barColor: '#f59e0b', barColor2: '#ef4444', glowColor: '#fbbf24', particle: '#fcd34d',
    skinColor: '#fce4c8', hairColor: '#2d1810', bodyColor: '#b45309',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2d1000'); grad.addColorStop(1, '#0d0500');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255,255,200,${0.02 + Math.random() * 0.04})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
  },
  '极简': {
    barColor: '#ffffff', barColor2: '#d4d4d4', glowColor: '#f5f5f5', particle: '#e5e5e5',
    skinColor: '#fafafa', hairColor: '#1a1a1a', bodyColor: '#404040',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.35, 0, Math.PI * 2); ctx.stroke();
    },
  },
  '动漫': {
    barColor: '#f472b6', barColor2: '#818cf8', glowColor: '#c4b5fd', particle: '#f9a8d4',
    skinColor: '#fff0f5', hairColor: '#f472b6', bodyColor: '#4f46e5',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1a0530'); grad.addColorStop(0.5, '#0f0520'); grad.addColorStop(1, '#1a1035');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 3 + i) * 0.2})`;
        ctx.beginPath(); ctx.arc((i * 137 + 50) % w, (Math.sin(t * 0.7 + i * 3.1) * 0.5 + 0.5) * h, 2, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
  '水墨': {
    barColor: '#1a1a1a', barColor2: '#4a4a4a', glowColor: '#333333', particle: '#666666',
    skinColor: '#f5f0e0', hairColor: '#1a1a1a', bodyColor: '#4a4a4a',
    bgDraw: (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      ctx.fillStyle = '#f0ebe0'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const r = 60 + Math.random() * 40;
        const g = ctx.createRadialGradient(w * 0.15 * i, h * 0.5, 0, w * 0.15 * i, h * 0.5, r);
        g.addColorStop(0, 'rgba(0,0,0,0.04)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w * 0.15 * i, h * 0.5, r, 0, Math.PI * 2); ctx.fill();
      }
    },
  },
};

function fakeFreqData(frame: number, buffer: Uint8Array) {
  for (let i = 0; i < buffer.length; i++) {
    const bass = (Math.sin(frame * 0.05 + i * 0.1) * 0.5 + 0.5) * (1 - i / buffer.length);
    buffer[i] = Math.floor(Math.max(10, bass * 180 + Math.sin(frame * 0.12 + i * 0.03) * 30 + 40 + Math.random() * 15));
  }
}

// Webcam + audio visualization overlay renderer
function drawWebcam(
  ctx: CanvasRenderingContext2D, w: number, h: number, t: number,
  videoEl: HTMLVideoElement, freqData: Uint8Array, bufLen: number, cfg: any,
) {
  // Mirror the webcam video onto canvas
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  if (videoEl.readyState >= 2) {
    ctx.drawImage(videoEl, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  // Semi-transparent overlay for style
  const overlayAlpha = 0.15;
  ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // Frequency visualization overlay (bottom area)
  const barCount = 40;
  const barW = w / barCount;
  const barMaxH = h * 0.15;
  for (let i = 0; i < barCount; i++) {
    const idx = Math.floor((i / barCount) * bufLen);
    const val = (freqData[idx] || 10) / 255;
    const barH = val * barMaxH;
    const x = i * barW;
    const y = h - barH;
    const grad = ctx.createLinearGradient(x, y, x, h);
    grad.addColorStop(0, cfg.barColor);
    grad.addColorStop(1, cfg.barColor2);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.6 + val * 0.4;
    ctx.fillRect(x + 1, y, barW - 2, barH);
  }
  ctx.globalAlpha = 1;

  // Style filter color wash
  const washAlpha = 0.08;
  ctx.fillStyle = cfg.barColor;
  ctx.globalAlpha = washAlpha;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  // Corner vignette
  const vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.75);
  vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, w, h);

  // Title text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `${Math.floor(w * 0.035)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText('AI MV - Live Performance', w / 2, h * 0.03);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

export default function AIMV() {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState('梦幻');
  const [status, setStatus] = useState<'idle' | 'generating' | 'recording' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('webcam');
  const [webcamReady, setWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);
  const user = useAuthStore((s) => s.user);

  // Init webcam
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      webcamStreamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();
      webcamVideoRef.current = video;
      setWebcamReady(true);
    } catch (e: any) {
      setWebcamError(e.message || '无法访问摄像头');
      setWebcamReady(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    webcamVideoRef.current = null;
    setWebcamReady(false);
  }, []);

  // Start webcam automatically
  useEffect(() => {
    startWebcam();
    return () => stopWebcam();
  }, [startWebcam, stopWebcam]);

  // Main draw loop
  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;
    const cfg = cfgs[style] || cfgs['梦幻'];
    const t = time * 0.001;
    frameRef.current++;

    // Freq data
    const analyser = analyserRef.current;
    const bufLen = analyser ? analyser.frequencyBinCount : 256;
    const freqData = new Uint8Array(bufLen);
    if (analyser) {
      analyser.getByteFrequencyData(freqData);
    } else {
      fakeFreqData(frameRef.current, freqData);
    }

    if (mode === 'webcam' && webcamVideoRef.current && webcamReady) {
      drawWebcam(ctx, w, h, t, webcamVideoRef.current, freqData, bufLen, cfg);
    } else {
      drawAvatar(ctx, w, h, t, freqData, bufLen, cfg);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [style, mode, webcamReady]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  const stopAll = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setStatus('idle');
    setProgress(0);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!file || !user || status === 'generating' || status === 'recording') return;

    setStatus('generating');
    setProgress(0);
    setVideoUrl(null);
    const chunks: Blob[] = [];

    try {
      // Setup audio
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.loop = true;

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      await audio.play();
      setStatus('recording');

      // Capture canvas
      const canvasStream = canvasRef.current!.captureStream(30);

      // Audio destination for recording
      const audioDest = ctx.createMediaStreamDestination();
      analyser.disconnect();
      analyser.connect(audioDest);
      analyser.connect(ctx.destination);

      const combinedStream = new MediaStream([
        canvasStream.getVideoTracks()[0],
        audioDest.stream.getAudioTracks()[0],
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 3000000 });

      const RECORD_SEC = 10;
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setProgress(Math.min(99, Math.round((elapsed / (RECORD_SEC * 1000)) * 100)));
        if (elapsed >= RECORD_SEC * 1000) clearInterval(progressTimer);
      }, 100);

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = () => {
        clearInterval(progressTimer);
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('done');
        setProgress(100);

        try {
          if (analyserRef.current && audioCtxRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current.connect(audioCtxRef.current.destination);
          }
        } catch {}

        audio.pause();
        URL.revokeObjectURL(url);

        api.post('/ai/mv', {
          title: file.name?.replace(/\.[^.]+$/, '') || 'AI MV',
          style,
          duration: `${RECORD_SEC}s`,
        }).catch(() => {});
      };

      recorder.start(100);
      setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, RECORD_SEC * 1000);
    } catch (e) {
      console.error('Generation failed:', e);
      setStatus('idle');
    }
  }, [file, user, status, style]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${file?.name?.replace(/\.[^.]+$/, '') || 'mv'}_${style}.webm`;
    a.click();
  };

  const isBusy = status === 'generating' || status === 'recording';

  return (
    <ToolPage title="AI MV" description="上传音乐，选择真人摄像头演唱或虚拟歌手动画，一键生成MV影片" icon="📺" model="Webcam + Canvas" tech={['真人摄像头', '虚拟歌手', '口型同步', '视频录制']}>
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode('webcam')}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'webcam' ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'
            }`}>
            <Camera size={16} /> 真人摄像头
          </button>
          <button onClick={() => setMode('avatar')}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${
              mode === 'avatar' ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'
            }`}>
            <User size={16} /> 虚拟歌手
          </button>
        </div>

        {/* Upload */}
        <div className="border-2 border-dashed border-primary-700/30 rounded-2xl p-6 text-center hover:border-primary-500/50 transition-all cursor-pointer" onClick={() => document.getElementById('mv-upload')?.click()}>
          <Upload size={36} className="text-primary-400 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">上传音乐文件</p>
          <p className="text-xs text-gray-500 mb-2">支持 MP3, WAV 格式</p>
          <input type="file" accept="audio/*" onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setVideoUrl(null);
            setStatus('idle');
            stopAll();
          }} className="hidden" id="mv-upload" />
          <label htmlFor="mv-upload" className="gradient-btn inline-flex items-center gap-2 cursor-pointer text-xs">
            <Music size={14} /> 选择音乐
          </label>
          {file && <p className="mt-2 text-xs text-primary-400">{file.name}</p>}
        </div>

        {/* Style */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">视觉风格</label>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <button key={s} onClick={() => { setStyle(s); setVideoUrl(null); setStatus('idle'); }}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${style === s ? 'gradient-btn' : 'glass text-gray-400 hover:text-white'}`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Preview canvas */}
        <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full block" />

          {mode === 'webcam' && webcamError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center">
                <Camera size={40} className="text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">摄像头不可用</p>
                <p className="text-xs text-gray-600 mt-1">{webcamError}</p>
                <button onClick={startWebcam} className="mt-3 text-xs gradient-btn px-3 py-1 cursor-pointer">重新尝试</button>
                <button onClick={() => setMode('avatar')} className="mt-2 block mx-auto text-xs text-primary-400">切换到虚拟歌手</button>
              </div>
            </div>
          )}

          {status === 'done' && videoUrl && (
            <div className="absolute inset-0">
              <video src={videoUrl} className="w-full h-full object-contain" controls autoPlay />
            </div>
          )}

          {isBusy && (
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 text-white text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {status === 'generating' ? '准备中...' : `录制中 ${progress}%`}
            </div>
          )}
        </div>

        {/* Progress */}
        {isBusy && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{status === 'generating' ? '正在初始化...' : '正在录制 MV...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-dark-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={handleGenerate}
            disabled={!file || isBusy || !user}
            className="gradient-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
            <Zap size={16} />
            {isBusy ? (status === 'generating' ? '初始化...' : '录制中...') : '一键生成 MV'}
          </button>
          {videoUrl && status === 'done' && (
            <button onClick={handleDownload}
              className="px-6 rounded-xl bg-primary-500/20 flex items-center gap-2 text-primary-400 hover:bg-primary-500/30 transition-all">
              <Download size={16} /> 下载
            </button>
          )}
          {status === 'done' && (
            <button onClick={() => { setStatus('idle'); setVideoUrl(null); }}
              className="px-4 rounded-xl glass text-gray-400 hover:text-white transition-all text-sm">
              重新生成
            </button>
          )}
        </div>

        {!user && <p className="text-center text-sm text-amber-400">请先登录</p>}

        {videoUrl && status === 'done' && (
          <div className="glass-card !p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Video size={16} className="text-green-400" />
              <span className="text-green-400">MV 生成完成</span>
              <span className="text-gray-400">| {mode === 'webcam' ? '真人摄像头' : '虚拟歌手'}</span>
              <span className="text-gray-400">| {style}</span>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  );
}
