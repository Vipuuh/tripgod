import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

export default function CountUp({ end, duration = 1.2, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  useEffect(() => {
    if (!isInView) return;
    
    // Parse the number from the string (e.g. "500+" -> 500)
    const endStr = String(end);
    const endVal = parseInt(endStr.replace(/[^\d]/g, ''), 10) || 0;
    if (endVal === 0) return;

    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * endVal));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };
    window.requestAnimationFrame(step);
  }, [isInView, end, duration]);

  // Extract non-numeric parts for suffix (e.g. "+", "%")
  const endStr = String(end);
  const extractedSuffix = endStr.replace(/[\d,]/g, '');

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('en-IN')}{extractedSuffix || suffix}
    </span>
  );
}
