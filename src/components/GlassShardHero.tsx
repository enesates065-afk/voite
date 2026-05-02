"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ShardProduct {
  id: string;
  name: string;
  price: string;
  image: string;
}

const SHARD_CONFIGS = [
  {
    index: 0, label: "01.",
    position: { top: "3%", left: "0%" },
    rotation: -13, scale: 1, width: 415, height: 515,
    clipPath: "polygon(7% 0%, 100% 2%, 94% 98%, 0% 100%)",
  },
  {
    index: 1, label: "02.",
    position: { top: "1%", right: "0%" },
    rotation: 12, scale: 0.96, width: 395, height: 495,
    clipPath: "polygon(2% 3%, 93% 0%, 100% 95%, 5% 100%)",
  },
  {
    index: 2, label: "03.",
    position: { bottom: "3%", left: "1%" },
    rotation: 10, scale: 0.93, width: 400, height: 495,
    clipPath: "polygon(5% 0%, 98% 3%, 96% 100%, 0% 96%)",
  },
  {
    index: 3, label: "04.",
    position: { bottom: "1%", right: "1%" },
    rotation: -11, scale: 0.97, width: 405, height: 500,
    clipPath: "polygon(3% 2%, 100% 0%, 97% 97%, 1% 100%)",
  },
];

// Bright glass chip fragments scattered between shards
const CHIPS = [
  { x: "20%", y: "14%", w: 22, h: 34, rot: -55, op: 0.75 },
  { x: "24%", y: "32%", w: 14, h: 20, rot: 42, op: 0.55 },
  { x: "17%", y: "52%", w: 28, h: 16, rot: -30, op: 0.65 },
  { x: "26%", y: "70%", w: 16, h: 26, rot: 68, op: 0.6 },
  { x: "31%", y: "84%", w: 20, h: 13, rot: -44, op: 0.5 },
  { x: "12%", y: "38%", w: 10, h: 18, rot: 75, op: 0.45 },
  { x: "8%",  y: "62%", w: 18, h: 24, rot: -62, op: 0.5 },
  { x: "34%", y: "22%", w: 12, h: 8,  rot: 30, op: 0.4 },
  { x: "73%", y: "10%", w: 24, h: 36, rot: 50, op: 0.7 },
  { x: "78%", y: "26%", w: 16, h: 22, rot: -40, op: 0.55 },
  { x: "81%", y: "58%", w: 30, h: 18, rot: 28, op: 0.65 },
  { x: "76%", y: "76%", w: 18, h: 28, rot: -58, op: 0.6 },
  { x: "88%", y: "42%", w: 12, h: 20, rot: 72, op: 0.5 },
  { x: "91%", y: "68%", w: 20, h: 13, rot: -35, op: 0.45 },
  { x: "64%", y: "6%",  w: 14, h: 10, rot: -22, op: 0.38 },
  { x: "42%", y: "92%", w: 16, h: 11, rot: 55, op: 0.42 },
  { x: "57%", y: "90%", w: 11, h: 18, rot: -38, op: 0.4 },
  { x: "47%", y: "5%",  w: 8,  h: 14, rot: 22, op: 0.35 },
  { x: "35%", y: "48%", w: 9,  h: 15, rot: 48, op: 0.38 },
  { x: "63%", y: "54%", w: 11, h: 9,  rot: -42, op: 0.36 },
  // Extra bright shards near shard edges
  { x: "28%", y: "42%", w: 6,  h: 10, rot: -70, op: 0.9 },
  { x: "32%", y: "58%", w: 5,  h: 8,  rot: 55,  op: 0.85 },
  { x: "69%", y: "40%", w: 7,  h: 11, rot: 60,  op: 0.9 },
  { x: "66%", y: "62%", w: 5,  h: 9,  rot: -48, op: 0.85 },
];

function GlassChip({ c, delay = 0 }: { c: typeof CHIPS[0]; delay?: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: c.x, top: c.y, width: c.w, height: c.h }}
      initial={{ opacity: 0, scale: 0.3, rotate: c.rot - 40 }}
      animate={{ opacity: c.op, scale: 1, rotate: c.rot }}
      transition={{ duration: 1.3, delay, ease: "easeOut" }}
    >
      <div style={{
        width: "100%", height: "100%",
        clipPath: "polygon(18% 0%, 100% 8%, 85% 100%, 0% 88%)",
        background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.8) 100%)",
        boxShadow: "0 0 8px rgba(255,255,255,0.6), 0 0 2px rgba(255,255,255,0.9), inset 0 0 0 0.5px rgba(255,255,255,0.9)",
      }} />
    </motion.div>
  );
}

function Shard({
  config, product, isHovered, anyHovered, onHover, onLeave,
}: {
  config: typeof SHARD_CONFIGS[0];
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
      initial={{ opacity: 0, scale: 0.75, rotate: config.rotation }}
      animate={{
        opacity: dimmed ? 0.18 : 1,
        scale: isHovered ? config.scale * 1.04 : config.scale,
        rotate: isHovered ? 0 : config.rotation,
        filter: dimmed ? "blur(5px)" : "blur(0px)",
      }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link href={product ? `/product/${product.id}` : "/drop"}>
        {/* Panel */}
        <div
          className="relative overflow-hidden"
          style={{ width: config.width, height: config.height, clipPath: config.clipPath }}
        >
          {/* Dark base */}
          <div className="absolute inset-0" style={{ background: "#050505" }} />

          {/* Product image */}
          {product && (
            <motion.div className="absolute inset-0"
              animate={{ opacity: isHovered ? 0.9 : 0.55 }}
              transition={{ duration: 0.4 }}>
              <Image
                src={product.image || "/images/hoodie.png"} alt={product.name}
                fill className="object-cover object-center"
                style={{
                  filter: isHovered ? "grayscale(15%)" : "grayscale(88%)",
                  transition: "filter 0.5s ease",
                  transform: "scale(1.04)",
                }}
              />
            </motion.div>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-0" style={{
            background: isHovered
              ? "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 52%, transparent 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.18) 100%)",
            transition: "background 0.5s ease",
          }} />

          {/* Glass surface shine */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 38%, rgba(255,255,255,0.04) 65%, transparent 100%)",
            opacity: isHovered ? 1 : 0.55,
            transition: "opacity 0.4s ease",
          }} />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0.65, y: isHovered ? 0 : 5 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-[9px] uppercase tracking-[0.5em] text-white/30 mb-2 font-light">{config.label}</p>
              <h3 className="text-[12px] uppercase tracking-[0.25em] text-white font-light leading-snug heading-style mb-2">
                {product?.name || "—"}
              </h3>
              {product?.price && <p className="text-[10px] font-mono text-white/40">₺{product.price}</p>}
            </motion.div>
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -12 }}
              transition={{ duration: 0.25, delay: 0.06 }}
              className="mt-3 flex items-center gap-2"
            >
              <span className="text-[9px] uppercase tracking-[0.42em] text-white/60">View</span>
              <span className="text-[11px] text-white/40">→</span>
            </motion.div>
          </div>
        </div>

        {/* Glass edge border — always on, brighter on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0.45 }}
          transition={{ duration: 0.4 }}
          style={{
            clipPath: config.clipPath,
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.38), 0 0 60px rgba(255,255,255,0.06)",
          }}
        />

        {/* Outer glow on hover */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ inset: -20, clipPath: config.clipPath }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{
            width: "100%", height: "100%",
            boxShadow: "0 0 80px rgba(255,255,255,0.08)",
          }} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function GlassShardHero() {
  const [products, setProducts] = useState<(ShardProduct | null)[]>([null, null, null, null]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [countdown, setCountdown] = useState({ h: 71, m: 59, s: 59 });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "heroProducts"));
        let ids: string[] = [];
        if (settingsDoc.exists() && settingsDoc.data().slots) {
          ids = settingsDoc.data().slots.filter(Boolean);
        }
        if (ids.length < 4) {
          const snap = await getDocs(collection(db, "products"));
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShardProduct));
          const extras = all.filter(p => !ids.includes(p.id)).slice(0, 4 - ids.length);
          ids = [...ids, ...extras.map(e => e.id)];
        }
        const fetched: (ShardProduct | null)[] = await Promise.all(
          ids.slice(0, 4).map(async (id) => {
            if (!id) return null;
            const d = await getDoc(doc(db, "products", id));
            return d.exists() ? { id: d.id, ...d.data() } as ShardProduct : null;
          })
        );
        setProducts(fetched);
      } catch (e) { console.error(e); }
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
    <section className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center">

      {/* Ambient center glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 60%)" }} />
      </div>

      {/* Glass chips */}
      <div className="absolute inset-0 pointer-events-none">
        {CHIPS.map((c, i) => <GlassChip key={i} c={c} delay={i * 0.045} />)}
      </div>

      {/* Shards + center */}
      <div className="relative w-full max-w-7xl mx-auto" style={{ height: "100vh" }}>
        {SHARD_CONFIGS.map((config, i) => (
          <Shard
            key={i}
            config={config}
            product={products[i] ?? undefined}
            isHovered={hoveredIndex === i}
            anyHovered={hoveredIndex !== null}
            onHover={() => setHoveredIndex(i)}
            onLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* Center logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: hoveredIndex !== null ? 0.28 : 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <h1
              className="font-light heading-style uppercase text-white mb-2"
              style={{ fontSize: "clamp(50px, 6.5vw, 92px)", letterSpacing: "0.16em" }}
            >
              VOITÉ.
            </h1>
            <p className="text-[8px] uppercase tracking-[0.72em] text-white/22 font-light mb-6">
              Silent Series
            </p>
            <p className="text-sm italic text-white/28 font-light mb-10 tracking-wide">
              Not made to be seen. Made to be felt.
            </p>
            <Link
              href="/drop"
              className="pointer-events-auto inline-block border border-white/18 px-12 py-4 text-[10px] uppercase tracking-[0.42em] text-white/55 hover:text-white hover:border-white/38 transition-all duration-300 font-light"
            >
              Enter
            </Link>
          </motion.div>
        </div>

        {/* Drop 01 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <p className="text-[8px] uppercase tracking-[0.6em] text-white/14">Drop 01</p>
        </div>

        {/* Countdown */}
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none">
          <div className="flex items-end gap-4">
            {[{ v: countdown.h, l: "Saat" }, { v: countdown.m, l: "Dak" }, { v: countdown.s, l: "San" }].map((t, i) => (
              <div key={i} className="relative flex flex-col items-center">
                {i > 0 && <span className="absolute -left-3 top-0 text-white/15 text-lg">:</span>}
                <span className="text-2xl font-mono font-light text-white/42 tabular-nums">{fmt(t.v)}</span>
                <span className="text-[7px] uppercase tracking-widest text-white/18">{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
