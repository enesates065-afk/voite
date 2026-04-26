"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  image: string;
  category?: string;
  seriesSlug?: string;
  dropNumber?: number;
}

const SERIES_LABEL: Record<string, string> = {
  "silent-series": "Silent Series",
  "void-series": "Void Series",
};

function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}

export function SearchModal({ open: externalOpen, onClose: externalClose }: { open?: boolean; onClose?: () => void } = {}) {
  const internal = useSearchModal();
  const open = externalOpen !== undefined ? externalOpen : internal.open;
  const handleClose = externalClose ?? (() => internal.setOpen(false));

  const [query, setQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products once on first open
  useEffect(() => {
    if (!open || fetched) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "products"));
        setAllProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setFetched(true);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [open, fetched]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
    else setQuery("");
  }, [open]);

  // Filter
  const results = query.trim().length < 1
    ? []
    : allProducts.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category?.toLowerCase().includes(query.toLowerCase()) ||
        (p.seriesSlug && SERIES_LABEL[p.seriesSlug]?.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8);

  // Trending (no query)
  const trending = query.trim().length < 1 ? allProducts.slice(0, 4) : [];

  return (
    <>
      {/* Trigger button — exported separately as SearchTrigger */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              className="fixed top-0 left-0 right-0 z-[101] mx-auto max-w-2xl mt-20 px-4"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="bg-[#080808] border border-white/8 overflow-hidden" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.8)" }}>

                {/* Search input row */}
                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
                  <Search size={16} className="text-white/25 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Ürün, kategori veya seri ara..."
                    className="flex-1 bg-transparent text-white text-sm font-light outline-none placeholder:text-white/20 tracking-wide"
                  />
                  {loading && <Loader2 size={14} className="animate-spin text-white/20 flex-shrink-0" />}
                  <div className="flex items-center gap-2">
                    <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] text-white/15 border border-white/10 font-mono">ESC</kbd>
                    <button onClick={handleClose} className="text-white/20 hover:text-white transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-[520px] overflow-y-auto hide-scrollbar">

                  {/* Search results */}
                  {query.trim().length > 0 && (
                    <div>
                      {results.length === 0 && !loading ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-white/20 text-xs uppercase tracking-widest">"{query}" için sonuç bulunamadı</p>
                          <p className="text-white/10 text-[10px] mt-2 font-light">Farklı kelimeler deneyin</p>
                        </div>
                      ) : (
                        <>
                          <div className="px-5 pt-4 pb-2">
                            <p className="text-[9px] uppercase tracking-[0.4em] text-white/20">{results.length} sonuç</p>
                          </div>
                          <div className="divide-y divide-white/3">
                            {results.map(product => (
                              <SearchResultItem key={product.id} product={product} onClose={handleClose} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Trending / recent when empty query */}
                  {query.trim().length === 0 && trending.length > 0 && (
                    <div>
                      <div className="px-5 pt-5 pb-3">
                        <p className="text-[9px] uppercase tracking-[0.4em] text-white/20">Öne Çıkanlar</p>
                      </div>
                      <div className="divide-y divide-white/3">
                        {trending.map(product => (
                          <SearchResultItem key={product.id} product={product} onClose={handleClose} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick nav */}
                  {query.trim().length === 0 && (
                    <div className="px-5 py-4 border-t border-white/5">
                      <p className="text-[9px] uppercase tracking-[0.4em] text-white/15 mb-3">Hızlı Erişim</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Drop", href: "/drop" },
                          { label: "Silent Series", href: "/seriler/silent-series" },
                          { label: "Void Series", href: "/seriler/void-series" },
                          { label: "Hoodie", href: "/kategoriler/hoodie" },
                          { label: "Arşiv", href: "/arsiv" },
                        ].map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleClose}
                            className="px-3 py-1.5 border border-white/8 text-[9px] uppercase tracking-[0.2em] text-white/30 hover:text-white hover:border-white/25 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer hint */}
                <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                  <p className="text-[8px] text-white/12 uppercase tracking-widest">VOITÉ. Arama</p>
                  <div className="flex items-center gap-3 text-[8px] text-white/12">
                    <span><kbd className="font-mono">↑↓</kbd> Gezin</span>
                    <span><kbd className="font-mono">↵</kbd> Aç</span>
                    <span><kbd className="font-mono">⌘K</kbd> Arama</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchResultItem({ product, onClose }: { product: Product; onClose: () => void }) {
  const discount = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)
    : null;

  return (
    <Link
      href={`/product/${product.id}`}
      onClick={onClose}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/3 transition-colors group"
    >
      {/* Thumbnail */}
      <div className="relative w-11 h-14 bg-[#0e0e0e] flex-shrink-0 overflow-hidden">
        <Image
          src={product.image || "/images/hoodie.png"}
          alt={product.name}
          fill
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-400"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-[0.1em] text-white/70 group-hover:text-white transition-colors font-light truncate">
          {product.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {product.category && (
            <span className="text-[8px] uppercase tracking-widest text-white/20">{product.category}</span>
          )}
          {product.seriesSlug && (
            <span className="text-[8px] text-white/15">· {SERIES_LABEL[product.seriesSlug] || product.seriesSlug}</span>
          )}
          {product.dropNumber && (
            <span className="text-[8px] text-white/15">· Drop {String(product.dropNumber).padStart(2, "0")}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-mono text-white/50">₺{parseInt(product.price).toLocaleString("tr-TR")}</p>
        {discount && (
          <p className="text-[8px] font-mono text-white/20 line-through">₺{parseInt(product.compareAtPrice!).toLocaleString("tr-TR")}</p>
        )}
        {discount && (
          <span className="text-[7px] text-white/50 bg-white/8 px-1.5 py-0.5">%{discount}</span>
        )}
      </div>

      <ArrowRight size={12} className="text-white/10 group-hover:text-white/40 transition-colors flex-shrink-0" />
    </Link>
  );
}

// Standalone trigger button to use in Navbar
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-white/50 hover:text-white transition-colors"
      aria-label="Arama"
    >
      <Search size={18} strokeWidth={1.5} />
    </button>
  );
}
