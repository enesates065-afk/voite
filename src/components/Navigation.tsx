"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import { SearchModal } from "@/components/SearchModal";

const SERIES = [
  { name: "Silent Series", slug: "silent-series" },
  { name: "Void Series", slug: "void-series" },
];

const CATEGORIES = [
  { name: "Hoodie", slug: "hoodie" },
  { name: "Sweatshirt", slug: "sweatshirt" },
  { name: "T-Shirt", slug: "t-shirt" },
  { name: "Pantolon", slug: "pantolon" },
  { name: "Aksesuar", slug: "aksesuar" },
];

function HoverDropdown({ label, items }: { label: string; items: { name: string; slug: string; prefix?: string }[] }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
        {label}
        <ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 mt-3 min-w-[180px] bg-[#0a0a0a] border border-white/10 rounded shadow-2xl overflow-hidden z-50"
          >
            {items.map((item) => (
              <Link
                key={item.slug}
                href={item.prefix ? `${item.prefix}/${item.slug}` : `/${item.slug}`}
                onClick={() => setOpen(false)}
                className="block px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                {item.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const { items, toggleCart } = useCartStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isScrolled ? "bg-voite-black/90 backdrop-blur-md py-4 border-b border-white/5" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white hover:text-white/70 transition-colors"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link href="/" className="text-2xl font-light tracking-[0.2em] uppercase text-white hover:text-white/70 transition-colors heading-style">
          VOITÉ.
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/drop" className="text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
            Drop
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </Link>

          <HoverDropdown
            label="Seriler"
            items={SERIES.map(s => ({ ...s, prefix: "/seriler" }))}
          />

          <HoverDropdown
            label="Kategoriler"
            items={CATEGORIES.map(c => ({ ...c, prefix: "/kategoriler" }))}
          />

          <Link href="/arsiv" className="text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
            Arşiv
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </Link>

          <Link href="/siparis-takibi" className="text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
            Sipariş Takibi
            <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </Link>
        </nav>

        {/* Right actions: Search + Cart */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSearchOpen(true)}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Ara"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button
            className="text-white/70 hover:text-white transition-colors relative z-50"
            onClick={toggleCart}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {items.reduce((t, i) => t + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search modal (portal) */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-voite-black/98 backdrop-blur-lg z-40 flex flex-col pt-24 px-8 overflow-y-auto"
          >
            <button
              className="absolute top-6 right-6 text-white hover:text-white/70 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>

            <nav className="flex flex-col space-y-2">
              {/* Drop */}
              <Link href="/drop" onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all py-3 border-b border-white/5">
                Drop
              </Link>

              {/* Seriler */}
              <div>
                <button onClick={() => setMobileSection(mobileSection === "series" ? null : "series")}
                  className="w-full text-left text-2xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all py-3 border-b border-white/5 flex justify-between items-center">
                  Seriler <ChevronDown size={18} className={`transition-transform ${mobileSection === "series" ? "rotate-180" : ""}`} />
                </button>
                {mobileSection === "series" && (
                  <div className="pl-6 space-y-2 py-3">
                    {SERIES.map(s => (
                      <Link key={s.slug} href={`/seriler/${s.slug}`} onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors py-1">
                        {s.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Kategoriler */}
              <div>
                <button onClick={() => setMobileSection(mobileSection === "cat" ? null : "cat")}
                  className="w-full text-left text-2xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all py-3 border-b border-white/5 flex justify-between items-center">
                  Kategoriler <ChevronDown size={18} className={`transition-transform ${mobileSection === "cat" ? "rotate-180" : ""}`} />
                </button>
                {mobileSection === "cat" && (
                  <div className="pl-6 space-y-2 py-3">
                    {CATEGORIES.map(c => (
                      <Link key={c.slug} href={`/kategoriler/${c.slug}`} onClick={() => setMobileMenuOpen(false)}
                        className="block text-sm uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors py-1">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/arsiv" onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all py-3 border-b border-white/5">
                Arşiv
              </Link>
              <Link href="/siparis-takibi" onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all py-3">
                Sipariş Takibi
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
