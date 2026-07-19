import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import { Volume2, VolumeX, Star, MapPin } from 'lucide-react';

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

// Single Reel Card
function ReelCard({ reel }) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const youtubeId = getYouTubeId(reel.video_url);

  // IntersectionObserver for autoplay on direct videos
  useEffect(() => {
    if (youtubeId || !videoRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [youtubeId]);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
    }
    setMuted((prev) => !prev);
  };

  return (
    <div
      ref={cardRef}
      className="relative flex-shrink-0 w-[220px] sm:w-[250px] rounded-2xl overflow-hidden shadow-lg bg-black"
      style={{ aspectRatio: '9/16', maxHeight: '420px' }}
    >
      {/* Video or YouTube iframe */}
      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0`}
          className="w-full h-full object-cover"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={reel.customer_name}
          style={{ border: 'none', pointerEvents: 'none' }}
        />
      ) : (
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url || undefined}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      {/* Mute/Unmute — only for direct video uploads */}
      {!youtubeId && (
        <button
          onClick={toggleMute}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 transition-all z-10 cursor-pointer"
        >
          {muted ? <VolumeX size={14} className="text-white" /> : <Volume2 size={14} className="text-white" />}
        </button>
      )}

      {/* Bottom customer info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
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

// Main Section — returns null if no active reels exist in DB
export default function CustomerReelSection() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const { data, error } = await supabase
          .from('customer_reels')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (!error && data) setReels(data);
      } catch (err) {
        console.error('Error fetching reels:', err);
      } finally {
        setLoading(false);
      }
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
