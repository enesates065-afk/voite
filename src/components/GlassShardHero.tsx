"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ShardProduct {
  id: string;
  name: string;
  price: string;
  image: string;
}

// Shard layout config — intentional, balanced asymmetry
const SHARD_CONFIGS = [
  {
    index: 0,
    label: "01.",
    // Top-left
    position: { top: "6%", left: "3%" },
    rotation: -14,
    scale: 1,
    width: 260,
    height: 320,
    clipPath: "polygon(8% 0%, 100% 2%, 94% 96%, 0% 100%)",
  },
  {
    index: 1,
    label: "02.",
    // Top-right
    position: { top: "4%", right: "3%" },
    rotation: 12,
    scale: 0.95,
    width: 240,
    height: 300,
    clipPath: "polygon(2% 4%, 92% 0%, 100% 92%, 6% 100%)",
  },
  {
    index: 2,
    label: "03.",
    // Bottom-left
    position: { bottom: "6%", left: "5%" },
    rotation: 10,
    scale: 0.92,
    width: 245,
    height: 295,
    clipPath: "polygon(5% 0%, 98% 3%, 96% 100%, 0% 95%)",
  },
  {
    index: 3,
    label: "04.",
    // Bottom-right
    position: { bottom: "4%", right: "4%" },
    rotation: -11,
    scale: 0.98,
    width: 255,
    height: 315,
    clipPath: "polygon(3% 2%, 100% 0%, 95% 97%, 2% 100%)",
  },
];

function Shard({
  config,
  product,
  isHovered,
  anyHovered,
  onHover,
  onLeave,
}: {
  config: (typeof SHARD_CONFIGS)[0];
  product?: ShardProduct;
  isHovered: boolean;
  anyHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const dimmed = anyHovered && !isHovered;

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{ ...config.position, width: config.width, zIndex: isHovered ? 20 : 10 }}
      initial={{ opacity: 0, scale: 0.85, rotate: config.rotation }}
      animate={{
        opacity: dimmed ? 0.3 : 1,
        scale: isHovered ? config.scale * 1.06 : config.scale,
        rotate: isHovered ? 0 : config.rotation,
        filter: dimmed ? "blur(2px)" : "blur(0px)",
      }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileInView={{ opacity: dimmed ? 0.3 : 1 }}
      viewport={{ once: true, amount: 0.3 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link href={product ? `/product/${product.id}` : "/drop"}>
        {/* Glass shard frame */}
        <div
          className="relative overflow-hidden"
          style={{
            width: config.width,
            height: config.height,
            clipPath: config.clipPath,
          }}
        >
          {/* Glass background */}
          <div
            className="absolute inset-0"
            style={{
              background: isHovered
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.03)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              transition: "background 0.5s ease",
            }}
          />

          {/* Product image */}
          {product && (
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: isHovered ? 1 : 0.55 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src={product.image || "/images/hoodie.png"}
                alt={product.name}
                fill
                className="object-cover object-center"
                style={{
                  filter: isHovered ? "grayscale(0%)" : "grayscale(100%)",
                  transition: "filter 0.5s ease",
                }}
              />
            </motion.div>
          )}

          {/* Dark gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: isHovered
                ? "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)"
                : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%)",
              transition: "background 0.5s ease",
            }}
          />

          {/* Edge highlight — glass rim */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              clipPath: config.clipPath,
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
              opacity: isHovered ? 1 : 0.5,
              transition: "opacity 0.4s ease",
            }}
          />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0.7, y: isHovered ? 0 : 4 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 mb-1 font-light">
                {config.label}
              </p>
              <h3 className="text-xs uppercase tracking-[0.2em] text-white font-light leading-snug heading-style mb-2">
                {product?.name || "—"}
              </h3>
              {product?.price && (
                <p className="text-[10px] font-mono text-white/50">₺{product.price}</p>
              )}
            </motion.div>

            <motion.div
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -8 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mt-3 flex items-center gap-1"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/60">View</span>
              <span className="text-[10px] text-white/40">→</span>
            </motion.div>
          </div>
        </div>

        {/* Outer glass border glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[1px]"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            clipPath: config.clipPath,
            boxShadow: "0 0 30px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.15)",
          }}
        />
      </Link>
    </motion.div>
  );
}

export default function GlassShardHero() {
  const [products, setProducts] = useState<ShardProduct[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ h: 71, m: 59, s: 59 });

  useEffect(() => {
    // Fetch up to 4 products (prefer drop products)
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(query(collection(db, "products"), limit(8)));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShardProduct));
        setProducts(all.slice(0, 4));
      } catch (e) {
        console.error(e);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const fmt = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative w-full min-h-screen bg-[#030303] overflow-hidden flex items-center justify-center">

      {/* Ambient background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%)" }} />
      </div>

      {/* Glass Shards */}
      <div className="relative w-full max-w-6xl mx-auto" style={{ height: "100vh" }}>
        {SHARD_CONFIGS.map((config, i) => (
          <Shard
            key={i}
            config={config}
            product={products[i]}
            isHovered={hoveredIndex === i}
            anyHovered={hoveredIndex !== null}
            onHover={() => setHoveredIndex(i)}
            onLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Center logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hoveredIndex !== null ? 0.4 : 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <h1
              className="font-light heading-style uppercase tracking-[0.2em] text-white mb-3"
              style={{ fontSize: "clamp(48px, 6vw, 88px)", letterSpacing: "0.15em" }}
            >
              VOITÉ.
            </h1>
            <p className="text-[9px] uppercase tracking-[0.55em] text-white/25 font-light mb-8">
              Silent Series
            </p>
            <p className="text-sm italic text-white/30 font-light mb-10 tracking-wide">
              Not made to be seen. Made to be felt.
            </p>
            <Link
              href="/drop"
              className="pointer-events-auto inline-block border border-white/20 px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-white/60 hover:text-white hover:border-white/40 transition-all duration-300 font-light"
            >
              Enter
            </Link>
          </motion.div>
        </div>

        {/* Drop label bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
          <p className="text-[9px] uppercase tracking-[0.5em] text-white/15">Drop 01</p>
        </div>

        {/* Countdown bottom right */}
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none">
          <div className="flex items-end gap-3">
            {[{ v: countdown.h, l: "Saat" }, { v: countdown.m, l: "Dak" }, { v: countdown.s, l: "San" }].map((t, i) => (
              <div key={i} className="flex flex-col items-center">
                {i > 0 && <span className="absolute text-white/15 text-lg -ml-4 mt-0.5">:</span>}
                <span className="text-2xl font-mono font-light text-white/50 tabular-nums">{fmt(t.v)}</span>
                <span className="text-[7px] uppercase tracking-widest text-white/20">{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile fallback — simple centered layout */}
      <style>{`
        @media (max-width: 768px) {
          .shard-desktop { display: none; }
        }
      `}</style>
    </section>
  );
}
