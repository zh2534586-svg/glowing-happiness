import { useState, useRef, useCallback } from 'react';
import { Play, Pause, Download, Music } from 'lucide-react';

interface Props {
  src?: string;
  title: string;
  downloadUrl?: string;
  downloadLabel?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export default function AudioPlayer({ src, title, downloadUrl, downloadLabel = '下载', onPlay, onPause }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      onPause?.();
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
      onPlay?.();
    }
  }, [playing, src, onPlay, onPause]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    onPause?.();
  };

  const handleDownload = async () => {
    const url = downloadUrl || src;
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title}.${url.endsWith('.mid') ? 'mid' : url.endsWith('.mp3') ? 'mp3' : 'wav'}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card !p-3 space-y-2">
      {src && <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata" />}

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!src}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
            playing ? 'bg-primary-500 text-white' : 'bg-white/10 text-primary-400 hover:bg-white/20'
          } disabled:opacity-30`}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Music size={14} className="text-primary-400 shrink-0" />
            <span className="text-sm font-medium truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 w-8">{fmt(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 accent-primary-500"
            />
            <span className="text-xs text-gray-500 w-8">{fmt(duration)}</span>
          </div>
        </div>

        {(downloadUrl || src) && (
          <button onClick={handleDownload} className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/15 transition-all shrink-0" title={downloadLabel}>
            <Download size={16} className="text-primary-400" />
          </button>
        )}
      </div>
    </div>
  );
}
