"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

const Instagram = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Twitter = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
import Image from "next/image";

export default function SocialProof() {
  return (
    <section className="py-24 bg-fener-black relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-6"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-mono tracking-widest text-white/80 uppercase">300,000+ Topluluk</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black heading-style uppercase tracking-tight">
            Kült <span className="text-fener-gold">Takipçi Kitlesi</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Tweet Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-[#0a0a0a] border border-white/10 p-6 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                <div>
                  <div className="font-bold text-white text-sm">Hype Beast</div>
                  <div className="text-white/40 text-xs">@hypebeast</div>
                </div>
              </div>
              <Twitter size={16} className="text-white/40" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed font-light">
              F-Editör yılın en sağlam koleksiyonunu çıkardı. Estetiği eşsiz. Bu drop'u kaçırmayın. 🔥
            </p>
            <div className="text-white/40 text-xs mt-2">10:42 · 24 Eki 2026</div>
          </motion.div>

          {/* Video Preview Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0a0a0a] border border-white/10 relative overflow-hidden group cursor-pointer aspect-square md:aspect-auto md:h-full"
          >
            <div className="absolute inset-0 bg-white/5 z-10"></div>
            <Image 
              src="/images/hoodie.png" 
              alt="Video thumbnail" 
              fill 
              className="object-cover object-center opacity-50 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 group-hover:bg-fener-gold group-hover:text-fener-black group-hover:border-fener-gold transition-colors">
                <Play size={20} className="ml-1" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
              <Instagram size={16} className="text-white" />
              <span className="text-white text-xs font-bold">@f.editor</span>
            </div>
          </motion.div>

          {/* Tweet Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#0a0a0a] border border-white/10 p-6 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                <div>
                  <div className="font-bold text-white text-sm">Street Style</div>
                  <div className="text-white/40 text-xs">@streetstyle</div>
                </div>
              </div>
              <Twitter size={16} className="text-white/40" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed font-light">
              Kalitesi inanılmaz. Sadece paketlemesi bile lüks bir marka gibi hissettiriyor. Her kuruşuna değer.
            </p>
            <div className="text-white/40 text-xs mt-2">14:15 · 25 Eki 2026</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
