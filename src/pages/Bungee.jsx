import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Star, Clock, MapPin, 
  Check, X, ShieldCheck, HeartCrack, Info, Video, Flame
} from 'lucide-react';

const bungeeOptions = [
  {
    id: 'bungee-117mv',
    name: '117M Bungee Jump with Video',
    height: '117 Metres',
    price: 4600,
    videoIncluded: true,
    img: '/bungee-hero.jpg',
    images: [
      '/bungee-hero.jpg',
      '/bungee-2.jpg',
      '/bungee-3.jpg'
    ],
    desc: 'The ultimate bungee jumping experience in India. Leap from a height of 117 metres above a rocky river valley. Includes high-definition DSLR video footage capturing your jump.'
  },
  {
    id: 'bungee-117m',
    name: '117M Bungee Jump without Video',
    height: '117 Metres',
    price: 4200,
    videoIncluded: false,
    img: '/bungee-4.jpg',
    images: [
      '/bungee-4.jpg',
      '/bungee-2.jpg',
      '/bungee-3.jpg'
    ],
    desc: 'The classic 117-metre high bungee jump. Jump from India\'s tallest cantilever platform. Capture the memories in your heart! (DSLR Video can be bought at the counter separately).'
  },
  {
    id: 'bungee-111mv',
    name: '111M Bungee Jump with Video',
    height: '111 Metres',
    price: 3600,
    videoIncluded: true,
    img: '/bungee-3.jpg',
    images: [
      '/bungee-3.jpg',
      '/bungee-1.jpg',
      '/bungee-4.jpg'
    ],
    desc: 'Leap from a height of 111 metres over a gorge. Includes cinematic DSLR video. Excellent value for adrenaline junkies.'
  },
  {
    id: 'bungee-combo',
    name: '111M Bungee + 113M Giant Swing Combo with Video',
    height: '111M & 113M combo',
    price: 5300,
    videoIncluded: true,
    badge: 'BEST VALUE',
    img: '/bungee-5.jpg',
    images: [
      '/bungee-5.jpg',
      '/swing-hero.png',
      '/bungee-3.jpg'
    ],
    desc: 'Get the best of both worlds! Leap off the 111M bungee platform, then take a massive swing on the 113M Giant Swing. Includes high-quality DSLR video footage for both activities.'
  },
  {
    id: 'bungee-rooftop',
    name: '104M Rooftop Bungee with Video',
    height: '104 Metres',
    price: 3500,
    videoIncluded: true,
    img: '/bungee-1.jpg',
    images: [
      '/bungee-1.jpg',
      '/bungee-4.jpg',
      '/bungee-2.jpg'
    ],
    desc: 'Jump from the rooftop platform suspended 104 metres in the air. Includes high-definition DSLR video. Offers unique aerial views of the valley.'
  },
  {
    id: 'bungee-couple',
    name: 'Couple Bungee with Video',
    height: '117 Metres',
    price: 5000,
    videoIncluded: true,
    img: '/couple-bungee-3.jpg',
    images: [
      '/couple-bungee-3.jpg',
      '/couple-bungee-1.jpg',
      '/couple-bungee-2.jpg',
      '/couple-bungee-4.jpg',
      '/couple-bungee-5.jpg'
    ],
    desc: 'Jump together with your partner from the 117M platform. Securely harnessed together for a shared adrenaline rush. Includes custom couple DSLR video.'
  }
];

export default function Bungee({ openBookingModal }) {
  const [selectedBungee, setSelectedBungee] = useState(null);
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  const reviews = [
    { name: 'Priya Patel', stars: 5, text: 'Leaping off the 117m platform was the craziest thing I have ever done! The crew was super supportive and the DSLR footage is amazing.' },
    { name: 'Aditya S.', stars: 5, text: 'The Bungee + Swing combo is worth every rupee. The swing was actually scarier than the bungee! Full 10% booking online worked perfectly.' },
    { name: 'Megha R.', stars: 5, text: 'We booked Couple Bungee for our anniversary. The harnesses are very secure, and jumping together was unforgettable!' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveReviewIdx((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {!selectedBungee ? (
          /* SECTION A: LISTING VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-20"
          >
            {/* Hero Banner */}
            <div className="relative h-[50vh] bg-black flex items-center justify-center text-center">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?q=80&w=1200')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative z-10 space-y-3 px-6">
                <span className="text-xs font-black text-accent tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit mx-auto">
                  <Flame size={12} fill="currentColor" /> India's Highest Jumps
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase">
                  Bungee Jumping
                </h1>
                <p className="text-gray-300 max-w-lg mx-auto text-sm sm:text-base font-medium">
                  Leap into space from India's highest cantilever platforms. Speeds up to 100 km/h.
                </p>
              </div>
            </div>

            {/* Bungee Options Cards List */}
            <div className="max-w-6xl mx-auto px-6 py-16 space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-2"
              >
                <h2 className="text-2xl md:text-4xl font-black font-display text-black">SELECT JUMP OPTION</h2>
                <div className="w-16 h-1 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] mx-auto" />
              </motion.div>

              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {bungeeOptions.map((opt) => (
                  <motion.div
                    key={opt.id}
                    variants={fadeInUp}
                    whileHover={{ y: -5 }}
                    onClick={() => {
                      setSelectedBungee(opt);
                      setCurrentImgIdx(0);
                      window.scrollTo(0, 0);
                    }}
                    className="border border-white/60 bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer hover:border-accent/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:scale-[1.01] transition-all flex flex-col justify-between h-full relative group shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                  >
                    {opt.badge && (
                      <span className="absolute top-4 right-4 bg-black text-accent text-[9px] font-black tracking-wider py-1 px-3 rounded-full border border-accent z-10">
                        {opt.badge}
                      </span>
                    )}
                    {/* Image box */}
                    <div className="h-36 sm:h-40 bg-gray-100 overflow-hidden relative border-b border-black/5">
                      <img 
                        src={opt.img} 
                        alt={opt.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 sm:p-5 space-y-3 flex-1">
                      <div className="flex justify-between items-start">
                        <span className="text-lg font-black font-display text-black">{opt.height}</span>
                        {opt.videoIncluded && (
                          <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <Video size={10} /> Video Inc.
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base font-display text-black leading-snug">{opt.name}</h3>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed line-clamp-3">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="p-4 sm:p-5 bg-gray-50 border-t border-black/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] block font-bold text-gray-500 uppercase">From</span>
                        <span className="text-xl font-black text-black">₹{opt.price.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-xs font-black uppercase text-black flex items-center gap-1">
                        View Details <ChevronLeft className="rotate-180" size={14} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* SECTION B: DETAILED VIEW */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="pb-24 pt-6"
          >
            {/* Back Button and Title */}
            <div className="max-w-4xl mx-auto px-6 space-y-6">
              <button
                onClick={() => setSelectedBungee(null)}
                className="flex items-center gap-1.5 py-2 px-3 border border-black/10 rounded-lg text-xs font-bold text-gray-600 hover:text-black hover:border-black transition-colors"
              >
                <ChevronLeft size={16} /> Back to Bungee Options
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-black text-accent font-black tracking-widest px-2 py-0.5 rounded uppercase">
                      BUNGEE JUMP
                    </span>
                    <span className="text-[10px] bg-red-100 text-red-800 font-black tracking-widest px-2 py-0.5 rounded uppercase">
                      Height: {selectedBungee.height}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold font-display text-black">{selectedBungee.name}</h1>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-black" /> Tapovan Office (Pickup Point), Rishikesh
                  </p>
                </div>

                <div className="text-left sm:text-right bg-[#FF5F00]/5 border border-[#FF5F00]/15 p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-gray-600 uppercase">Package Price</span>
                  <span className="text-2xl font-black text-black">₹{selectedBungee.price.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] font-bold text-[#FF5F00] uppercase mt-0.5">Pay only 10% (₹{Math.round(selectedBungee.price * 0.1)}) to book!</span>
                </div>
              </div>

              {/* Slider / Image Gallery */}
              <div className="h-48 sm:h-72 w-full rounded-2xl overflow-hidden relative border border-black/10 group">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentImgIdx}
                    src={selectedBungee.images[currentImgIdx]} 
                    alt={`${selectedBungee.name} view ${currentImgIdx + 1}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/35" />
                
                {/* Left/Right Navigation Buttons */}
                <button 
                  onClick={() => setCurrentImgIdx((prev) => (prev - 1 + selectedBungee.images.length) % selectedBungee.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentImgIdx((prev) => (prev + 1) % selectedBungee.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-xs flex items-center justify-center text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md hover:bg-black/75 z-10"
                >
                  <ChevronLeft size={16} className="rotate-180" />
                </button>

                {/* Bottom Slide Indicators (Dots) */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  {selectedBungee.images.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentImgIdx(dotIdx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer border-none ${dotIdx === currentImgIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                    />
                  ))}
                </div>

                {/* Specs overlay on image */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs bg-black/65 backdrop-blur-sm p-4 rounded-xl">
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-gray-400 text-[10px] uppercase font-bold">Timings</span>
                      <span className="font-bold">10:00 AM - 09:00 PM</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-[10px] uppercase font-bold">Activity Site</span>
                      <span className="font-bold">Shivpuri Canyon</span>
                    </div>
                  </div>
                  {selectedBungee.videoIncluded && (
                    <div className="px-3 py-1 bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold rounded-lg flex items-center gap-1">
                      <Video size={12} fill="currentColor" /> HD DSLR Video Included
                    </div>
                  )}
                </div>
              </div>

              {/* Pay 10% Banner */}
              <div className="bg-[#FFF0E5] border-2 border-[#FF6B00] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-black">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={28} className="text-black flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-tight">PAY 10% ADVANCE ONLINE TO SECURE SLOT</h4>
                    <p className="text-xs text-gray-600 font-medium">Book now at just ₹{Math.round(selectedBungee.price * 0.1)} per jumper. Pay 90% balance on arrival.</p>
                  </div>
                </div>
                <button
                  onClick={() => openBookingModal({
                    id: selectedBungee.id,
                    name: selectedBungee.name,
                    price: selectedBungee.price,
                    category: 'bungee',
                    videoIncluded: selectedBungee.videoIncluded
                  })}
                  className="w-full sm:w-auto py-3 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase rounded-xl hover:shadow-[0_4px_15px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
                >
                  Book Now
                </button>
              </div>

              {/* Auto Sliding Reviews */}
              <div className="border border-black/5 bg-gray-50 rounded-xl p-6 relative overflow-hidden min-h-[110px] flex items-center">
                <div className="space-y-2 w-full">
                  <div className="flex text-yellow-400 gap-0.5">
                    {[...Array(reviews[activeReviewIdx].stars)].map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm font-medium italic text-black pr-16">
                    "{reviews[activeReviewIdx].text}"
                  </p>
                  <span className="text-xs font-bold text-gray-500">— {reviews[activeReviewIdx].name}</span>
                </div>
                <span className="absolute right-6 text-[10px] bg-[#FF5F00]/10 text-[#FF5F00] border border-[#FF5F00]/20 font-bold px-2 py-0.5 rounded">Jump Guest</span>
              </div>

              {/* About and Highlights */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-display text-black uppercase tracking-tight">About this Jump</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {selectedBungee.desc} Rishikesh is home to India's most advanced cantilever jump platforms, built and supervised by certified experts from New Zealand and Australia. Feel the ultimate weightless drop over a stunning rocky canyon.
                </p>
              </div>

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-black/5">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Check size={16} className="text-green-600 stroke-[3]" /> What's Included
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-gray-600">
                    <li>• International-grade Safety Harness</li>
                    <li>• Jump Briefing by Certified Bungy Master</li>
                    <li>• Personalized Jump Certificate of Courage</li>
                    <li>• Transport from Tapovan Office to Jump Zone</li>
                    {selectedBungee.videoIncluded ? (
                      <li className="text-green-700 font-bold">• 1x HD DSLR Video Footage (Included)</li>
                    ) : (
                      <li>• DSLR footage available for purchase</li>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm font-display text-black uppercase tracking-wider flex items-center gap-1.5">
                    <X size={16} className="text-red-600 stroke-[3]" /> What's Excluded
                  </h4>
                  <ul className="space-y-2 text-xs font-medium text-gray-600">
                    <li>• Drone Footage (Extra: ₹800 at counter)</li>
                    <li>• Viewer entry to the jump bridge zone (₹500/viewer)</li>
                    <li>• Personal food and beverage expenses</li>
                  </ul>
                </div>
              </div>

              {/* Safety, Eligibility and Restrictions */}
              <div className="p-6 border border-red-100 bg-red-50/50 rounded-2xl space-y-4">
                <h4 className="font-bold text-sm font-display text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartCrack size={16} className="text-red-700" /> Health & Medical Eligibility
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-gray-700">
                  <div className="space-y-2">
                    <span className="block font-bold text-red-800">Eligibility Criteria:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Age: 14 to 70 Years</li>
                      <li>Weight: 40 to 110 kg</li>
                      <li>Full briefing compliance required</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <span className="block font-bold text-red-800">Strictly NOT Suitable For:</span>
                    <ul className="list-disc pl-4 space-y-1 bg-red">
                      <li>Pregnant women</li>
                      <li>Heart conditions, high BP or breathing ailments</li>
                      <li>Epilepsy or chronic back/neck spinal conditions</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Logistics Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Pickup Point & Logistics</span>
                  <p className="text-sm font-semibold text-black flex items-center gap-1">
                    <MapPin size={16} /> Tapovan Main Office, Bungee Center Rishikesh
                  </p>
                  <p className="text-xs text-gray-500">Free shuttle departs for the activity zone every 30 minutes from our Tapovan registration desk.</p>
                </div>
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Refund Policy</span>
                  <p className="text-sm font-semibold text-black flex items-center gap-1">
                    <Info size={16} /> 100% Refundable
                  </p>
                  <p className="text-xs text-gray-500">Full refund if canceled up to 24 hours prior to selected schedule. No slot transfer within 12 hours.</p>
                </div>
              </div>
            </div>

            {/* Mobile / Sticky Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/10 p-4 z-40 flex items-center justify-between max-w-4xl mx-auto rounded-t-xl shadow-xl">
              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">{selectedBungee.name}</span>
                <span className="text-lg font-black text-black">
                  ₹{selectedBungee.price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-semibold"> total</span>
                </span>
              </div>
              <button
                onClick={() => openBookingModal({
                  id: selectedBungee.id,
                  name: selectedBungee.name,
                  price: selectedBungee.price,
                  category: 'bungee',
                  videoIncluded: selectedBungee.videoIncluded
                })}
                className="py-3.5 px-6 bg-gradient-to-r from-[#FF5F00] to-[#FF3E00] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:shadow-[0_4px_20px_rgba(255,95,0,0.3)] hover:scale-[1.02] transition-all border-none cursor-pointer font-display"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
