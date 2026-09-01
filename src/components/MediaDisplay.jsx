import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Extract YouTube Video / Short ID
export const getYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const patterns = [
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&#]+)/
  ];
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

// Extract Instagram Reel / Post ID
export const getInstagramId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const pattern = /(?:instagram\.com|instagr\.am)\/(?:reel|p)\/([^/?&#]+)/;
  const match = cleanUrl.match(pattern);
  return match && match[1] ? match[1] : null;
};

// Check if URL is any kind of video (Direct file, YouTube, Instagram, Vimeo, Data URL, etc.)
export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim().toLowerCase();

  // Direct video file extensions
  if (/\.(mp4|webm|mov|ogg|m4v|3gp|mkv|avi)(\?.*)?$/i.test(cleanUrl)) return true;

  // Embedded video platforms
  if (
    cleanUrl.includes('youtube.com/shorts/') ||
    cleanUrl.includes('youtube.com/watch') ||
    cleanUrl.includes('youtu.be/') ||
    cleanUrl.includes('youtube.com/embed/') ||
    cleanUrl.includes('instagram.com/reel/') ||
    cleanUrl.includes('instagram.com/p/') ||
    cleanUrl.includes('vimeo.com/')
  ) {
    return true;
  }

  // Data / Blob URLs
  if (cleanUrl.startsWith('data:video/') || cleanUrl.startsWith('blob:')) return true;

  return false;
};

/**
 * MediaDisplay component
 * Smartly renders images or autoplaying muted videos (direct MP4/MOV or YouTube Shorts / Reels)
 */
export default function MediaDisplay({
  src,
  alt = '',
  className = '',
  style = {},
  objectFit = 'cover',
  fallbackSrc = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200',
  showSoundToggle = false,
  muted: initialMuted = true,
  autoPlay = true,
  loop = true,
  onClick,
  onLoad
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [muted, setMuted] = useState(initialMuted);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const youtubeId = getYouTubeId(currentSrc);
  const instaId = getInstagramId(currentSrc);
  const isVideo = isVideoUrl(currentSrc);

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);

    if (youtubeId && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: []
        }),
        '*'
      );
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  if (!currentSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        style={{ objectFit, ...style }}
        onClick={onClick}
      />
    );
  }

  if (isVideo) {
    if (youtubeId) {
      return (
        <div className={`relative overflow-hidden ${className}`} style={style} onClick={onClick}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&playlist=${youtubeId}&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1`}
            className="w-full h-full object-cover pointer-events-none border-0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={alt || 'Video player'}
            onLoad={onLoad}
          />
          {showSoundToggle && (
            <button
              type="button"
              onClick={toggleMute}
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs z-10 cursor-pointer border border-white/20 transition-all active:scale-95"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#FF6B00]" />}
            </button>
          )}
        </div>
      );
    }

    if (instaId) {
      return (
        <div className={`relative overflow-hidden ${className}`} style={style} onClick={onClick}>
          <iframe
            src={`https://www.instagram.com/reel/${instaId}/embed`}
            className="w-full h-full object-cover border-0 bg-black"
            allowFullScreen
            title={alt || 'Instagram Reel'}
            onLoad={onLoad}
          />
        </div>
      );
    }

    // Direct video file (.mp4, .webm, .mov, etc.)
    return (
      <div className={`relative overflow-hidden ${className}`} style={style} onClick={onClick}>
        <video
          ref={videoRef}
          src={currentSrc}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectFit }}
          onError={handleError}
          onLoadedData={onLoad}
        />
        {showSoundToggle && (
          <button
            type="button"
            onClick={toggleMute}
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs z-10 cursor-pointer border border-white/20 transition-all active:scale-95"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-[#FF6B00]" />}
          </button>
        )}
      </div>
    );
  }

  // Standard Image
  return (
    <img
      src={currentSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit, ...style }}
      onError={handleError}
      onLoad={onLoad}
      onClick={onClick}
    />
  );
}
