"use client";

import { useState, useEffect } from "react";

/**
 * Dynamic loading message component that cycles through Arabic quotes.
 * 
 * Displays motivational quotes that scroll continuously - old text moves down,
 * new text moves up from bottom.
 */
export default function LoadingMessage() {
  const quotes = [
    "أصحاب العمل يقضون 6 ثوانٍ فقط في تقييم سيرتك، اجعل كل ثانية تحسب.",
    "الاستثمار في سيرة ذاتية قوية هو استثمار مباشر في مستقبلك المهني.",
    "الكلمات المفتاحية هي سر الوصول. سيرة ذاتية ذكية تعني ظهوراً أقوى في نتائج البحث.",
    "الوضوح هو سيد الموقف. السيرة الذاتية المختصرة والمباشرة تصل أسرع إلى الهدف."
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Start animation
      setIsAnimating(true);
      
      // After animation completes, change quote
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
        setIsAnimating(false);
      }, 600); // Animation duration
    }, 4000); // Change quote every 4 seconds

    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 mb-6 overflow-hidden relative">
      {/* Quote Container with scrolling animation */}
      <div className="relative min-h-[2rem] overflow-hidden">
        {/* Current quote - moves down when animating */}
        <p
          className={`text-blue-800 text-sm md:text-base absolute inset-0 flex items-center ${
            isAnimating 
              ? "animate-scroll-down-message" 
              : ""
          }`}
          style={{ 
            fontFamily: "'Zain', sans-serif"
          }}
          dir="rtl"
        >
          {quotes[currentIndex]}
        </p>
        
        {/* Next quote - moves up from bottom when animating */}
        {isAnimating && (
          <p
            className="text-blue-800 text-sm md:text-base absolute inset-0 flex items-center animate-scroll-up-message"
            style={{ 
              fontFamily: "'Zain', sans-serif"
            }}
            dir="rtl"
          >
            {quotes[(currentIndex + 1) % quotes.length]}
          </p>
        )}
      </div>
    </div>
  );
}

