"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items, toggleCart } = useCartStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
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

        {/* Desktop Links */}
        <nav className="hidden md:flex space-x-8">
          {[
            { name: "Drop", href: "/drop" },
            { name: "Temel Parçalar", href: "/temel-parcalar" },
            { name: "Arşiv", href: "/arsiv" },
            { name: "Hakkımızda", href: "/hakkimizda" }
          ].map((item) => (
            <Link key={item.name} href={item.href} className="text-xs font-light uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors relative group">
              {item.name}
              <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        <button 
          className="text-white/70 hover:text-white transition-colors relative z-50"
          onClick={toggleCart}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-voite-black/95 backdrop-blur-lg z-40 flex flex-col justify-center items-center"
          >
            <button
              className="absolute top-6 right-6 text-white hover:text-white/70 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={32} />
            </button>
            <nav className="flex flex-col space-y-8 text-center">
              {[
                { name: "Drop", href: "/drop" },
                { name: "Temel Parçalar", href: "/temel-parcalar" },
                { name: "Arşiv", href: "/arsiv" },
                { name: "Hakkımızda", href: "/hakkimizda" }
              ].map((item) => (
                <Link 
                  key={item.name}
                  href={item.href} 
                  className="text-3xl font-light uppercase tracking-[0.2em] text-white/70 hover:text-white heading-style transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
