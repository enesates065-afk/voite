"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-voite-black text-white">
      {/* Absolute minimal black background, no grain or textures needed for pitch black minimal look */}
      <div className="absolute inset-0 bg-black z-0"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-light tracking-[0.1em] heading-style uppercase mb-2">
            VOITÉ.
          </h1>

          <h2 className="text-sm md:text-base tracking-[0.3em] text-white/50 uppercase font-light mb-8">

          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="text-sm md:text-lg text-white/40 max-w-xl font-light tracking-widest italic mb-16"
        >
          Not made to be seen. Made to be felt.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeOut" }}
        >
          <Link
            href="/shop"
            className="group px-12 py-4 border border-white/20 text-white/70 uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-700 ease-in-out"
          >
            Shop
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
