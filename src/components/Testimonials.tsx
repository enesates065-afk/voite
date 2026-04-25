"use client";

import { motion } from "framer-motion";

const testimonials = [
  { text: "Kalitesi inanılmaz. Sahip olduğum en iyi hoodie.", author: "@alex.street", tag: "Drop 00" },
  { text: "Bu kadar detay beklemiyordum. Dokusu kusursuz.", author: "@karl_vision", tag: "Essentials" },
  { text: "Premium hissettiriyor. Kesimine özen gösterdikleri çok belli.", author: "@marcus.fits", tag: "Drop 00" }
];

export default function Testimonials() {
  return (
    <section className="py-32 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      {/* Decorative text bg */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] font-black uppercase text-white/[0.02] whitespace-nowrap pointer-events-none heading-style">
        Topluluk
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black heading-style uppercase tracking-tight">
            Sokaktaki <span className="text-fener-gold">Ses</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="bg-fener-black border border-white/5 p-10 flex flex-col justify-between hover:border-white/20 transition-colors"
            >
              <div className="text-fener-gold text-4xl font-serif leading-none mb-6">&quot;</div>
              <p className="text-lg text-white/80 font-light leading-relaxed mb-8">
                {test.text}
              </p>
              <div className="flex justify-between items-center border-t border-white/10 pt-6">
                <span className="font-mono text-sm tracking-tighter text-white">{test.author}</span>
                <span className="text-[10px] uppercase tracking-widest text-white/40">{test.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
