"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

const SERIES_LABEL: Record<string, string> = {
  "silent-series": "Silent Series",
  "void-series": "Void Series",
};

interface Drop {
  id: string;
  seriesSlug: string;
  seriesName: string;
  dropNumber: number;
  description: string;
  active: boolean;
  archived: boolean;
  endDate?: any;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
  sizeStock?: Record<string, number>;
  category: string;
}

function useCountdown(endDate?: Date) {
  const [time, setTime] = useState({ h: 71, m: 59, s: 59 });

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const target = endDate ? endDate.getTime() : now + 72 * 3600 * 1000;
      const diff = Math.max(0, target - now);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return time;
}

function DropSlide({ drop, products }: { drop: Drop; products: Product[] }) {
  const countdown = useCountdown(drop.endDate?.toDate?.());
  const fmt = (n: number) => String(n).padStart(2, "0");
  const seriesLabel = SERIES_LABEL[drop.seriesSlug] || drop.seriesName || drop.seriesSlug;

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Drop Header */}
      <div className="border-b border-white/5 py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 mb-3 font-light">
              {seriesLabel}
            </p>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white font-bold bg-white/10 px-3 py-1.5">
                Şimdi Yayında
              </span>
            </div>
            <h2 className="text-6xl md:text-8xl font-light heading-style uppercase tracking-tighter text-white">
              Drop <span className="text-white/30">{String(drop.dropNumber).padStart(2, "0")}</span>
            </h2>
            {drop.description && (
              <p className="text-white/30 text-sm font-light mt-3 max-w-md">{drop.description}</p>
            )}
          </div>

          {/* Countdown */}
          <div className="bg-[#0a0a0a] border border-white/10 px-8 py-6 flex items-center gap-6">
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/25 writing-mode-vertical hidden md:block">Kalan Zaman</span>
            <div className="flex gap-4">
              {[{ v: countdown.h, l: "SAAT" }, { v: countdown.m, l: "DAK" }, { v: countdown.s, l: "SAN" }].map((t, i) => (
                <div key={i} className="flex flex-col items-center">
                  {i > 0 && <span className="absolute text-white/20 text-2xl mt-1 -ml-6">:</span>}
                  <span className="text-4xl md:text-5xl font-mono font-light tabular-nums text-white">
                    {fmt(t.v)}
                  </span>
                  <span className="text-[8px] uppercase tracking-widest text-white/25 mt-1">{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 px-6 md:px-12 py-12">
        <div className="max-w-6xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/15 uppercase tracking-widest text-sm">Ürünler yakında eklenecek</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  image={product.image}
                  stock={product.stock}
                  sizeStock={product.sizeStock}
                  dropNumber={drop.dropNumber}
                />
              ))}
            </div>
          )}

          <div className="mt-10">
            <Link
              href={`/seriler/${drop.seriesSlug}/drop-${drop.dropNumber}`}
              className="text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors border-b border-white/15 pb-1"
            >
              Tüm Drop Detayları →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DropPageClient() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [productsByDrop, setProductsByDrop] = useState<Record<string, Product[]>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dir, setDir] = useState(0); // -1 left, 1 right

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Active drops (not archived)
        const dropQ = query(collection(db, "drops"), where("active", "==", true), where("archived", "==", false));
        const dropSnap = await getDocs(dropQ);
        const dropData: Drop[] = dropSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Drop))
          .sort((a, b) => a.dropNumber - b.dropNumber);
        setDrops(dropData);

        // Products for each drop
        const prodMap: Record<string, Product[]> = {};
        await Promise.all(dropData.map(async drop => {
          const pQ = query(
            collection(db, "products"),
            where("seriesSlug", "==", drop.seriesSlug),
            where("dropNumber", "==", drop.dropNumber)
          );
          const pSnap = await getDocs(pQ);
          prodMap[drop.id] = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        }));
        setProductsByDrop(prodMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const go = (direction: number) => {
    setDir(direction);
    setCurrent(c => Math.max(0, Math.min(drops.length - 1, c + direction)));
  };

  if (loading) return (
    <div className="min-h-screen bg-voite-black flex items-center justify-center">
      <div className="space-y-2 text-center">
        <div className="w-8 h-px bg-white/20 mx-auto animate-pulse" />
        <p className="text-white/20 text-xs uppercase tracking-widest">Yükleniyor</p>
      </div>
    </div>
  );

  if (drops.length === 0) return (
    <div className="min-h-screen bg-voite-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/15 text-xs uppercase tracking-[0.4em] mb-3">Aktif Drop</p>
        <p className="text-white/30 text-3xl font-light heading-style uppercase tracking-tight">Yakında</p>
        <p className="text-white/15 text-sm mt-4 font-light">Yeni drop duyurusu için takipte kalın.</p>
      </div>
    </div>
  );

  const activeDrop = drops[current];
  const activeProducts = productsByDrop[activeDrop?.id] || [];

  return (
    <div className="min-h-screen bg-voite-black pt-24 relative overflow-hidden">
      
      {/* Slide Area */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={activeDrop.id}
          custom={dir}
          initial={{ opacity: 0, x: dir * 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -dir * 60 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <DropSlide drop={activeDrop} products={activeProducts} />
        </motion.div>
      </AnimatePresence>

      {/* Navigation (only if multiple drops) */}
      {drops.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur border border-white/10 px-6 py-3 rounded z-50">
          <button
            onClick={() => go(-1)}
            disabled={current === 0}
            className="text-white/40 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex gap-2 items-center">
            {drops.map((d, i) => (
              <button key={d.id} onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                className={`transition-all duration-300 ${i === current ? "w-6 h-1.5 bg-white rounded-full" : "w-1.5 h-1.5 bg-white/20 rounded-full hover:bg-white/40"}`}
              />
            ))}
          </div>

          <button
            onClick={() => go(1)}
            disabled={current === drops.length - 1}
            className="text-white/40 hover:text-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>

          <div className="w-px h-4 bg-white/10" />
          <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">
            {current + 1} / {drops.length}
          </span>
        </div>
      )}
    </div>
  );
}
