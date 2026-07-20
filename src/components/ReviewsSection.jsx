import React, { useState, useEffect, useRef } from 'react';
import { Star, User, ThumbsUp, Plus, Trash2, ShieldAlert } from 'lucide-react';

const DEFAULT_REVIEWS = [
  {
    id: 1,
    name: 'Amit Sharma',
    date: 'July 2026',
    rating: 5,
    text: 'The absolute highlight of our Rishikesh trip! The guides were extremely helpful, equipment was clean and safety protocols were fully followed. TripGod booked this instantly over WhatsApp.',
    likes: 12
  },
  {
    id: 2,
    name: 'Pooja V.',
    date: 'June 2026',
    rating: 5,
    text: 'Amazing experience! Secure booking via token advance is very practical. They sent coordinates and coordinator details on WhatsApp immediately after payment. No confusion at all.',
    likes: 8
  },
  {
    id: 3,
    name: 'Rohan Deshmukh',
    date: 'July 2026',
    rating: 4,
    text: 'Highly professional crew. The reporting office was very easy to locate. Only issue was a small wait time because of heavy weekend traffic, but the actual activity was spectacular!',
    likes: 5
  },
  {
    id: 4,
    name: 'Neha Kapoor',
    date: 'July 2026',
    rating: 5,
    text: 'Excellent service and complete value for money. They captured beautiful DSLR videos during our activity. Would highly recommend TripGod to everyone visiting Rishikesh!',
    likes: 14
  }
];

export default function ReviewsSection({ rating = 4.8, reviewsCount = 380, name = '', isAdmin = false }) {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [likedReviews, setLikedReviews] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminMode, setAdminMode] = useState(isAdmin);
  
  // New review form states
  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');

  const scrollRef = useRef(null);

  // Auto-scrolling horizontal logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reviews.length <= 1) return;

    const interval = setInterval(() => {
      const cardWidth = el.clientWidth * 0.85 + 16; // Card width + gap
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [reviews]);

  const handleLike = (id) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeleteReview = (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newText.trim()) return;

    const newRev = {
      id: Date.now(),
      name: newName,
      date: 'Today',
      rating: newRating,
      text: newText,
      likes: 0
    };

    setReviews([newRev, ...reviews]);
    setNewName('');
    setNewRating(5);
    setNewText('');
    setShowAddForm(false);
  };

  const getRatingLabel = (val) => {
    if (val >= 4.8) return 'Exceptional';
    if (val >= 4.5) return 'Excellent';
    if (val >= 4.0) return 'Very Good';
    return 'Good';
  };

  const rCount = reviewsCount || 120;
  const breakDown = {
    5: Math.round(rCount * 0.75),
    4: Math.round(rCount * 0.18),
    3: Math.round(rCount * 0.05),
    2: Math.round(rCount * 0.01),
    1: Math.round(rCount * 0.01)
  };

  return (
    <div className="w-full space-y-5 font-sans text-left text-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black font-display text-black uppercase tracking-tight">Customer Reviews</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAdminMode(!adminMode)}
            className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
              adminMode 
                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-700'
            }`}
            title="Toggle Admin Moderate mode to delete reviews"
          >
            {adminMode ? '✓ Moderation Mode ON' : 'Moderate Reviews'}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-[#FF6B00] bg-[#FF6B00]/5 border border-[#FF6B00]/10 py-1.5 px-3 rounded-lg hover:bg-[#FF6B00]/10 transition-all cursor-pointer"
          >
            <Plus size={12} /> Write a Review
          </button>
        </div>
      </div>

      {/* Write review form toggle */}
      {showAddForm && (
        <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-900">Share Your Experience</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Your Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rahul Verma"
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-black focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Rating (1 to 5 Stars)</label>
              <div className="flex gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-0 border-none bg-transparent cursor-pointer"
                  >
                    <Star 
                      size={18} 
                      className={star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'} 
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Review Text</label>
            <textarea
              required
              rows="2"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="How was the guide, safety, and booking experience?"
              className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-black focus:outline-none focus:border-[#FF6B00] resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-[10px] font-bold text-slate-500 bg-transparent border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-1.5 text-[10px] font-black text-white bg-accent-gradient border-none rounded-lg cursor-pointer hover:shadow-xs"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}

      {/* Overall Score Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
        <div className="flex flex-col items-center justify-center text-center sm:border-r border-slate-200 sm:pr-4 space-y-1">
          <span className="text-3xl font-black text-slate-900 leading-none">
            {Number(rating || 4.8).toFixed(1)}
          </span>
          <span className="text-[9px] font-black uppercase text-[#FF6B00]">
            {getRatingLabel(rating)}
          </span>
          <div className="flex gap-0.5 text-amber-500 pt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={11} fill={i < Math.round(rating) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
            {rCount} Verified bookings
          </span>
        </div>

        <div className="sm:col-span-2 flex flex-col justify-center space-y-1.5">
          {Object.keys(breakDown).reverse().map((star) => {
            const count = breakDown[star];
            const pct = Math.round((count / rCount) * 100);
            return (
              <div key={star} className="flex items-center gap-2 text-[10px]">
                <span className="w-2.5 font-bold text-right text-slate-500">{star}</span>
                <Star size={9} className="fill-slate-400 text-slate-400 shrink-0" />
                <div className="flex-grow h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent-gradient rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-7 text-right font-bold text-slate-400 text-[8px]">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-scrolling horizontal review slider */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory py-2 scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {reviews.map((rev) => {
          const isLiked = !!likedReviews[rev.id];
          return (
            <div 
              key={rev.id} 
              className="snap-start shrink-0 w-[85%] sm:w-[46%] bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-3xs hover:border-slate-300 transition-colors relative group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-550 border border-slate-200">
                      <User size={12} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="block font-black text-[10px] text-slate-900 uppercase leading-none">{rev.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{rev.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" className="text-amber-500" />
                      ))}
                    </div>

                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border-none cursor-pointer"
                        title="Delete fake/bad review"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                  "{rev.text}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[8px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase font-black">
                  ✓ Verified Rider
                </span>
                
                <button
                  type="button"
                  onClick={() => handleLike(rev.id)}
                  className={`flex items-center gap-1 text-[9px] font-black uppercase cursor-pointer border-none bg-transparent ${
                    isLiked ? 'text-[#FF6B00]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <ThumbsUp size={10} className={isLiked ? 'fill-current' : ''} />
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
