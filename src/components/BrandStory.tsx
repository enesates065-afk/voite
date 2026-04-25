"use client";

import { motion } from "framer-motion";

export default function BrandStory() {
  return (
    <section className="py-32 relative flex items-center justify-center bg-fener-black overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-fener-navy/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-light leading-tight tracking-wide text-white/90 font-serif" style={{ fontFamily: "var(--font-heading)" }}>
            &quot;F-Editör, yüz binlere ulaşan dijital bir edit kültüründen doğdu. Şimdi bu enerjiyi <span className="text-transparent bg-clip-text bg-gradient-to-r from-fener-gold to-yellow-600 font-bold">giyilebilir bir kimliğe</span> dönüştürüyor.&quot;
          </h2>
          
          <div className="mt-16 flex justify-center items-center gap-4">
            <div className="h-[1px] w-12 bg-fener-gold/50"></div>
            <span className="uppercase tracking-[0.3em] text-xs font-bold text-fener-gold">Hikayemiz</span>
            <div className="h-[1px] w-12 bg-fener-gold/50"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
