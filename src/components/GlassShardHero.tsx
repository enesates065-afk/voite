"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
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
    position: { top: "5%", left: "2%" },
    rotation: -14, scale: 1, width: 265, height: 330,
    clipPath: "polygon(8% 0%, 100% 2%, 94% 96%, 0% 100%)",
  },
  {
    index: 1, label: "02.",
    position: { top: "3%", right: "2%" },
    rotation: 12, scale: 0.95, width: 245, height: 308,
    clipPath: "polygon(2% 4%, 92% 0%, 100% 92%, 6% 100%)",
  },
  {
    index: 2, label: "03.",
    position: { bottom: "5%", left: "4%" },
    rotation: 10, scale: 0.92, width: 248, height: 300,
    clipPath: "polygon(5% 0%, 98% 3%, 96% 100%, 0% 95%)",
  },
  {
    index: 3, label: "04.",
    position: { bottom: "3%", right: "3%" },
    rotation: -11, scale: 0.98, width: 258, height: 318,
    clipPath: "polygon(3% 2%, 100% 0%, 95% 97%, 2% 100%)",
  },
];

// Background glass fragments — scattered debris
const BG_FRAGMENTS = [
  { x: "8%", y: "18%", w: 60, h: 80, rot: -32, clip: "polygon(15% 0%, 100% 8%, 88% 100%, 0% 85%)", op: 0.18 },
  { x: "14%", y: "55%", w: 35, h: 55, rot: 22, clip: "polygon(0% 12%, 85% 0%, 100% 88%, 10% 100%)", op: 0.12 },
  { x: "5%", y: "75%", w: 50, h: 40, rot: -45, clip: "polygon(20% 0%, 100% 5%, 80% 100%, 0% 90%)", op: 0.10 },
  { x: "22%", y: "8%", w: 40, h: 65, rot: 18, clip: "polygon(5% 0%, 100% 10%, 95% 100%, 0% 92%)", op: 0.14 },
  { x: "28%", y: "82%", w: 55, h: 38, rot: -25, clip: "polygon(0% 5%, 90% 0%, 100% 95%, 8% 100%)", op: 0.11 },
  { x: "75%", y: "6%", w: 45, h: 70, rot: 28, clip: "polygon(10% 0%, 100% 5%, 92% 100%, 0% 88%)", op: 0.13 },
  { x: "82%", y: "60%", w: 38, h: 52, rot: -18, clip: "polygon(0% 8%, 92% 0%, 100% 90%, 5% 100%)", op: 0.15 },
  { x: "88%", y: "80%", w: 60, h: 42, rot: 35, clip: "polygon(12% 0%, 100% 6%, 88% 100%, 0% 82%)", op: 0.10 },
  { x: "72%", y: "88%", w: 42, h: 58, rot: -40, clip: "polygon(5% 2%, 95% 0%, 100% 95%, 0% 98%)", op: 0.12 },
  { x: "42%", y: "2%", w: 30, h: 48, rot: 15, clip: "polygon(0% 0%, 100% 8%, 92% 100%, 5% 95%)", op: 0.08 },
  { x: "55%", y: "90%", w: 36, h: 42, rot: -22, clip: "polygon(8% 0%, 100% 2%, 94% 100%, 0% 98%)", op: 0.09 },
  // Near top-left shard
  { x: "18%", y: "28%", w: 28, h: 42, rot: -55, clip: "polygon(20% 0%, 100% 15%, 80% 100%, 0% 85%)", op: 0.20 },
  { x: "24%", y: "42%", w: 22, h: 32, rot: 40, clip: "polygon(0% 20%, 80% 0%, 100% 80%, 15% 100%)", op: 0.16 },
  // Near top-right shard
  { x: "68%", y: "30%", w: 32, h: 48, rot: 48, clip: "polygon(10% 0%, 100% 12%, 88% 100%, 0% 82%)", op: 0.18 },
  { x: "76%", y: "18%", w: 24, h: 36, rot: -38, clip: "polygon(0% 10%, 90% 0%, 100% 88%, 8% 100%)", op: 0.14 },
  // Near bottom-left
  { x: "20%", y: "68%", w: 26, h: 38, rot: 62, clip: "polygon(15% 0%, 100% 10%, 85% 100%, 0% 90%)", op: 0.17 },
  // Near bottom-right
  { x: "70%", y: "72%", w: 30, h: 44, rot: -52, clip: "polygon(5% 0%, 95% 8%, 100% 95%, 0% 88%)", op: 0.19 },
  { x: "78%", y: "85%", w: 20, h: 30, rot: 30, clip: "polygon(12% 0%, 100% 5%, 88% 100%, 0% 92%)", op: 0.13 },
];

function GlassFragment({ f, delay = 0 }: { f: typeof BG_FRAGMENTS[0]; delay?: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: f.x, top: f.y, width: f.w, height: f.h }}
      initial={{ opacity: 0, scale: 0.6, rotate: f.rot - 20 }}
      animate={{ opacity: f.op, scale: 1, rotate: f.rot }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
    >
      <div
        style={{
          width: "100%", height: "100%",
          clipPath: f.clip,
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.12) 100%)",
          boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.35), 0 2px 8px rgba(255,255,255,0.04)",
          backdropFilter: "blur(2px)",
        }}
      />
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
      initial={{ opacity: 0, scale: 0.8, rotate: config.rotation }}
      animate={{
        opacity: dimmed ? 0.25 : 1,
        scale: isHovered ? config.scale * 1.07 : config.scale,
        rotate: isHovered ? 0 : config.rotation,
        filter: dimmed ? "blur(3px)" : "blur(0px)",
      }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      viewport={{ once: true }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <Link href={product ? `/product/${product.id}` : "/drop"}>
        {/* Main frame */}
        <div
          className="relative overflow-hidden"
          style={{ width: config.width, height: config.height, clipPath: config.clipPath }}
        >
          {/* Glass base */}
          <div className="absolute inset-0" style={{
            background: isHovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
            backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            transition: "background 0.5s ease",
          }} />

          {/* Product image */}
          {product && (
            <motion.div className="absolute inset-0"
              animate={{ opacity: isHovered ? 1 : 0.5 }}
              transition={{ duration: 0.4 }}>
              <Image
                src={product.image || "/images/hoodie.png"} alt={product.name}
                fill className="object-cover object-center"
                style={{ filter: isHovered ? "grayscale(0%)" : "grayscale(85%)", transition: "filter 0.5s ease" }}
              />
            </motion.div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: isHovered
              ? "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 55%, rgba(0,0,0,0.15) 100%)",
            transition: "background 0.5s ease",
          }} />

          {/* Glass rim shine */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.06) 100%)",
            opacity: isHovered ? 1 : 0.5, transition: "opacity 0.4s ease",
          }} />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <motion.div animate={{ opacity: isHovered ? 1 : 0.65, y: isHovered ? 0 : 5 }} transition={{ duration: 0.3 }}>
              <p className="text-[8px] uppercase tracking-[0.45em] text-white/35 mb-1 font-light">{config.label}</p>
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-white font-light leading-snug heading-style mb-1.5">
                {product?.name || "—"}
              </h3>
              {product?.price && <p className="text-[9px] font-mono text-white/45">₺{product.price}</p>}
            </motion.div>
            <motion.div animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              transition={{ duration: 0.25, delay: 0.06 }} className="mt-3 flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-[0.35em] text-white/55">View</span>
              <span className="text-[10px] text-white/35">→</span>
            </motion.div>
          </div>
        </div>

        {/* Small glass chips around shard edges */}
        {[-1, 1].map((side) =>
          [0.2, 0.5, 0.8].map((pos) => (
            <div
              key={`${side}-${pos}`}
              className="absolute pointer-events-none"
              style={{
                width: 8 + Math.random() * 10, height: 10 + Math.random() * 14,
                right: side === 1 ? -6 : undefined, left: side === -1 ? -6 : undefined,
                top: `${pos * 90}%`,
                clipPath: "polygon(20% 0%, 100% 10%, 80% 100%, 0% 88%)",
                background: "rgba(255,255,255,0.15)",
                transform: `rotate(${side * (25 + pos * 40)}deg)`,
                opacity: 0.3,
              }}
            />
          ))
        )}

        {/* Glow on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ clipPath: config.clipPath, boxShadow: "0 0 40px rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.18)" }}
        />
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
        // Try admin-selected hero products first
        const settingsDoc = await getDoc(doc(db, "settings", "heroProducts"));
        let ids: string[] = [];

        if (settingsDoc.exists() && settingsDoc.data().slots) {
          ids = settingsDoc.data().slots.filter(Boolean);
        }

        if (ids.length < 4) {
          // Fill remaining from latest products
          const snap = await getDocs(collection(db, "products"));
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShardProduct));
          const existing = ids;
          const extras = all.filter(p => !existing.includes(p.id)).slice(0, 4 - existing.length);
          ids = [...existing, ...extras.map(e => e.id)];
        }

        // Fetch each product
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
    <section className="relative w-full min-h-screen bg-[#030303] overflow-hidden flex items-center justify-center">

      {/* Subtle ambient center glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.012) 0%, transparent 65%)" }} />
      </div>

      {/* Background glass fragments */}
      <div className="absolute inset-0 pointer-events-none">
        {BG_FRAGMENTS.map((f, i) => (
          <GlassFragment key={i} f={f} delay={i * 0.04} />
        ))}
      </div>

      {/* Shards */}
      <div className="relative w-full max-w-6xl mx-auto" style={{ height: "100vh" }}>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: hoveredIndex !== null ? 0.35 : 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <h1
              className="font-light heading-style uppercase text-white mb-3"
              style={{ fontSize: "clamp(46px, 6vw, 88px)", letterSpacing: "0.18em" }}
            >
              VOITÉ.
            </h1>
            <p className="text-[8px] uppercase tracking-[0.6em] text-white/20 font-light mb-8">

            </p>
            <p className="text-sm italic text-white/25 font-light mb-10 tracking-wide">
              Not made to be seen. Made to be felt.
            </p>
            <Link
              href="/drop"
              className="pointer-events-auto inline-block border border-white/15 px-10 py-4 text-[10px] uppercase tracking-[0.35em] text-white/50 hover:text-white hover:border-white/35 transition-all duration-300 font-light"
            >
              Shop Void Series
            </Link>
          </motion.div>
        </div>

        {/* Drop 01 label */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <p className="text-[8px] uppercase tracking-[0.55em] text-white/12">Drop 01</p>
        </div>

        {/* Countdown */}
        <div className="absolute bottom-8 right-8 z-30 pointer-events-none">
          <div className="flex items-end gap-4">
            {[{ v: countdown.h, l: "Saat" }, { v: countdown.m, l: "Dak" }, { v: countdown.s, l: "San" }].map((t, i) => (
              <div key={i} className="relative flex flex-col items-center">
                {i > 0 && <span className="absolute -left-3 top-0 text-white/15 text-lg">:</span>}
                <span className="text-2xl font-mono font-light text-white/40 tabular-nums">{fmt(t.v)}</span>
                <span className="text-[7px] uppercase tracking-widest text-white/18">{t.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
