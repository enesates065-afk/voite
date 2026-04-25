"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function DropSystem() {
  // Set target date for the drop (e.g., 72 hours from now)
  const [timeLeft, setTimeLeft] = useState({
    hours: 71,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-24 bg-[#050505] relative border-y border-white/5">
      {/* Decorative lines */}
      <div className="absolute top-0 left-10 w-[1px] h-full bg-white/5 hidden md:block"></div>
      <div className="absolute top-0 right-10 w-[1px] h-full bg-white/5 hidden md:block"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-block border border-fener-gold/30 px-4 py-1 text-fener-gold uppercase tracking-[0.2em] text-xs font-bold mb-2">
              Şimdi Yayında
            </div>
            <h2 className="text-5xl md:text-7xl font-black heading-style uppercase tracking-tighter">
              Drop <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">01</span>
            </h2>
            <p className="text-xl text-white/60 font-light">72 saat boyunca yayında. Tükendiğinde sonsuza dek arşivlenecek.</p>
            
            <div className="pt-6">
              <Link 
                href="/drop" 
                className="inline-block px-10 py-4 bg-white text-fener-black font-bold uppercase tracking-widest hover:bg-fener-gold transition-colors duration-300"
              >
                Drop'a Eriş
              </Link>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 w-full max-w-md bg-[#0a0a0a] border border-white/10 p-8 flex flex-col items-center justify-center gap-6 box-glow relative overflow-hidden"
          >
            {/* Inner subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-fener-gold/5 to-transparent pointer-events-none"></div>

            <span className="text-sm uppercase tracking-[0.3em] text-white/50 font-bold z-10">Kalan Zaman</span>
            
            <div className="flex gap-4 md:gap-8 z-10">
              <div className="flex flex-col items-center">
                <span className="text-5xl md:text-6xl font-mono font-light tracking-tighter">{formatNumber(timeLeft.hours)}</span>
                <span className="text-xs uppercase tracking-widest text-fener-gold mt-2">Saat</span>
              </div>
              <span className="text-4xl font-light text-white/20 mt-2">:</span>
              <div className="flex flex-col items-center">
                <span className="text-5xl md:text-6xl font-mono font-light tracking-tighter">{formatNumber(timeLeft.minutes)}</span>
                <span className="text-xs uppercase tracking-widest text-fener-gold mt-2">Dak</span>
              </div>
              <span className="text-4xl font-light text-white/20 mt-2">:</span>
              <div className="flex flex-col items-center">
                <span className="text-5xl md:text-6xl font-mono font-light tracking-tighter">{formatNumber(timeLeft.seconds)}</span>
                <span className="text-xs uppercase tracking-widest text-fener-gold mt-2">San</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
