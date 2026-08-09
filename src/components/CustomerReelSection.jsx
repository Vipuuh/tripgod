import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase';
import { Volume2, VolumeX, Star, MapPin, Play, Pause } from 'lucide-react';

// Extract YouTube video ID from various YouTube URL formats
const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Extract Instagram Reel/Post ID
const getInstagramId = (url) => {
  if (!url) return null;
  const pattern = /(?:instagram\.com|instagr\.am)\/(?:reel|p)\/([^/?&]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
};

// Single Reel Card with sound control and tap-to-play/pause
function ReelCard({ reel }) {
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showIndicator, setShowIndicator] = useState(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const cardRef = useRef(null);
  const youtubeId = getYouTubeId(reel.video_url);
  const instaId = getInstagramId(reel.video_url);

  // IntersectionObserver for autoplay when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsPlaying(true);
            if (videoRef.current) videoRef.current.play().catch(() => {});
            if (iframeRef.current && youtubeId) {
              iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
                '*'
              );
            }
          } else {
            setIsPlaying(false);
            if (videoRef.current) videoRef.current.pause();
            if (iframeRef.current && youtubeId) {
              iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                '*'
              );
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [youtubeId, instaId]);

  const toggleMute = (e) => {
    e.stopPropagation();
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

  const togglePlayPause = (e) => {
    e.stopPropagation();
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);

    setShowIndicator(nextPlaying ? 'play' : 'pause');
    setTimeout(() => setShowIndicator(null), 900);

    if (youtubeId && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextPlaying ? 'playVideo' : 'pauseVideo',
          args: []
        }),
        '*'
      );
    } else if (videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={togglePlayPause}
      className="relative flex-shrink-0 w-[220px] sm:w-[250px] rounded-2xl overflow-hidden shadow-lg bg-black cursor-pointer group select-none"
      style={{ aspectRatio: '9/16', maxHeight: '420px' }}
    >
      {/* Video or YouTube / Instagram iframe */}
      {youtubeId ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
          className="w-full h-full object-cover pointer-events-none"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={reel.customer_name}
          style={{ border: 'none' }}
        />
      ) : instaId ? (
        <iframe
          src={`https://www.instagram.com/reel/${instaId}/embed`}
          className="w-full h-full object-cover bg-slate-900"
          allowFullScreen
          title={reel.customer_name}
          style={{ border: 'none' }}
        />
      ) : (
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url || undefined}
          muted={muted}
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/20 pointer-events-none" />

      {/* Audio Mute/Unmute Button (Top Right) */}
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute Sound' : 'Mute Sound'}
        className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/25 transition-all z-20 cursor-pointer text-white shadow-md active:scale-90"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#FF6B00]" />}
      </button>

      {/* Play/Pause Overlay Indicator on Touch/Click */}
      <AnimatePresence>
        {(showIndicator || !isPlaying) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="w-14 h-14 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-white shadow-2xl">
              {isPlaying && showIndicator === 'play' ? (
                <Play size={26} className="fill-white translate-x-0.5" />
              ) : (
                <Pause size={26} className="fill-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom customer info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
        {reel.rating && (
          <div className="flex items-center gap-1 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={i < Math.round(reel.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/30'}
              />
            ))}
          </div>
        )}
        <p className="text-white font-bold text-sm leading-tight">{reel.customer_name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {reel.activity_type && (
            <span className="text-[10px] bg-[#FF6B00] text-white font-bold px-2 py-0.5 rounded-full">
              {reel.activity_type}
            </span>
          )}
          {reel.location && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/70 font-medium">
              <MapPin size={8} />{reel.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Section — returns null if no active reels exist
export default function CustomerReelSection() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      let supabaseActive = [];
      try {
        const { data, error } = await supabase
          .from('customer_reels')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (!error && data) supabaseActive = data;
      } catch (err) {
        console.warn('Error fetching reels from Supabase:', err);
      }

      // Check localStorage for active reels as fallback/sync
      let localActive = [];
      try {
        localActive = JSON.parse(localStorage.getItem('tripgod_customer_reels') || '[]')
          .filter(r => r.is_active);
      } catch (e) {
        localActive = [];
      }

      const dbIds = new Set(supabaseActive.map(r => String(r.id)));
      const uniqueLocal = localActive.filter(r => !dbIds.has(String(r.id)));
      const combined = [...supabaseActive, ...uniqueLocal].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

      setReels(combined);
      setLoading(false);
    };
    fetchReels();
  }, []);


  // Hidden when 0 active reels — no heading, no empty space
  if (loading || reels.length === 0) return null;

  return (
    <div className="w-full py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <span className="text-[10px] font-black uppercase text-[#FF6B00] tracking-widest bg-[#FF6B00]/5 border border-[#FF6B00]/15 px-3 py-1 rounded-full inline-block mb-3">
            REAL EXPERIENCES
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight text-neutral-900 uppercase">
            What Our Customers Say
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Real reviews from real adventurers — in their own words.
          </p>
        </motion.div>

        {/* Horizontal Scroll Carousel — 2 cards visible, hint for more */}
        <div
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {reels.map((reel) => (
            <div key={reel.id} className="snap-start">
              <ReelCard reel={reel} />
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-slate-400 font-medium mt-4 tracking-wider uppercase">
          Swipe to see more →
        </p>
      </div>
    </div>
  );
}
