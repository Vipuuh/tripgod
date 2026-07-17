import React, { useState } from 'react';
import { Star, thumbsUp, User, ThumbsUp, Camera } from 'lucide-react';

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=200',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=200',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=200',
  'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=200'
];

const DEFAULT_REVIEWS = [
  {
    id: 1,
    name: 'Amit Sharma',
    date: 'July 2026',
    rating: 5,
    text: 'The absolute highlight of our Rishikesh trip! The guides were extremely helpful, equipment was clean and safety protocols were fully followed. TripGod booked this instantly over WhatsApp.',
    likes: 12,
    tag: 'Top Review'
  },
  {
    id: 2,
    name: 'Pooja V.',
    date: 'June 2026',
    rating: 5,
    text: 'Amazing experience! Secure booking via token advance is very practical. They sent coordinates and coordinator details on WhatsApp immediately after payment. No confusion at all.',
    likes: 8,
    tag: 'Top Review'
  },
  {
    id: 3,
    name: 'Rohan Deshmukh',
    date: 'July 2026',
    rating: 4,
    text: 'Highly professional crew. The reporting office was very easy to locate. Only issue was a small wait time because of heavy weekend traffic, but the actual activity was spectacular!',
    likes: 5,
    tag: 'Recent Review'
  },
  {
    id: 4,
    name: 'Neha Kapoor',
    date: 'July 2026',
    rating: 5,
    text: 'Excellent service and complete value for money. They captured beautiful DSLR videos during our activity. Would highly recommend TripGod to everyone visiting Rishikesh!',
    likes: 14,
    tag: 'Top Review'
  }
];

export default function ReviewsSection({ rating = 4.8, reviewsCount = 380, name = '' }) {
  const [activeTab, setActiveTab] = useState('top');
  const [likedReviews, setLikedReviews] = useState({});

  const handleLike = (id) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getRatingLabel = (val) => {
    if (val >= 4.8) return 'Exceptional';
    if (val >= 4.5) return 'Excellent';
    if (val >= 4.0) return 'Very Good';
    return 'Good';
  };

  // Consistent star counts for mock breakdown
  const rCount = reviewsCount || 120;
  const breakDown = {
    5: Math.round(rCount * 0.75),
    4: Math.round(rCount * 0.18),
    3: Math.round(rCount * 0.05),
    2: Math.round(rCount * 0.01),
    1: Math.round(rCount * 0.01)
  };

  const reviewsList = activeTab === 'top' 
    ? DEFAULT_REVIEWS.filter(r => r.tag === 'Top Review')
    : DEFAULT_REVIEWS;

  return (
    <div className="w-full space-y-6 font-sans text-left text-slate-800">
      <h3 className="text-lg font-bold font-display text-black uppercase tracking-tight">Customer Reviews</h3>

      {/* 1. Rating Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200/60 rounded-3xl p-5 md:p-6 shadow-2xs">
        {/* Overall Rating Block */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 pb-5 md:pb-0 md:pr-6 space-y-1">
          <span className="text-4xl font-black text-slate-900 leading-none">
            {Number(rating || 4.8).toFixed(1)}
          </span>
          <span className="text-xs font-black uppercase text-[#FF6B00]">
            {getRatingLabel(rating)}
          </span>
          <div className="flex gap-0.5 text-amber-500 pt-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} fill={i < Math.round(rating) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1.5">
            Based on {rCount} verified bookings
          </span>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-2">
          {Object.keys(breakDown).reverse().map((star) => {
            const count = breakDown[star];
            const pct = Math.round((count / rCount) * 100);
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-3 font-bold text-right text-slate-500">{star}</span>
                <Star size={11} className="fill-slate-400 text-slate-400 shrink-0" />
                <div className="flex-grow h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-gradient rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right font-bold text-slate-400 text-[10px]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Photo Reviews Gallery */}
      <div className="space-y-2.5">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Camera size={12} className="text-slate-400" /> Traveler Photos ({MOCK_PHOTOS.length})
        </h4>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-0.5">
          {MOCK_PHOTOS.map((src, i) => (
            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 shadow-2xs hover:scale-105 transition-transform duration-300">
              <img src={src} alt="Traveler upload" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Review Tabs & Filtering */}
      <div className="border-b border-slate-100 flex gap-4 text-xs font-black uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('top')}
          className={`pb-2.5 cursor-pointer relative ${
            activeTab === 'top' ? 'text-[#FF6B00]' : 'text-slate-400'
          }`}
        >
          Top Reviews
          {activeTab === 'top' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`pb-2.5 cursor-pointer relative ${
            activeTab === 'recent' ? 'text-[#FF6B00]' : 'text-slate-400'
          }`}
        >
          All Reviews
          {activeTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B00]" />
          )}
        </button>
      </div>

      {/* 4. Reviews List */}
      <div className="space-y-4 pt-1">
        {reviewsList.map((rev) => {
          const isLiked = !!likedReviews[rev.id];
          return (
            <div key={rev.id} className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-3 shadow-3xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                    <User size={14} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="block font-black text-xs text-slate-900 uppercase leading-none">{rev.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{rev.date}</span>
                  </div>
                </div>
                <div className="flex gap-0.5 text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={11} fill="currentColor" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {rev.text}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase font-black tracking-wide">
                  Verified Booking
                </span>
                <button
                  onClick={() => handleLike(rev.id)}
                  className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none bg-transparent ${
                    isLiked ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ThumbsUp size={11} className={isLiked ? 'fill-current' : ''} />
                  Helpful ({rev.likes + (isLiked ? 1 : 0)})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
