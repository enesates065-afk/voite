"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const categories = [
  { name: "Drop", desc: "Sınırlı üretim ürünler", size: "md:col-span-2 md:row-span-2", href: "/drop" },
  { name: "Temel Parçalar", desc: "Ana koleksiyon", size: "md:col-span-1 md:row-span-1", href: "/essentials" },
  { name: "Sınırlı", desc: "Özel işbirlikleri", size: "md:col-span-1 md:row-span-1", href: "/limited" },
  { name: "Arşiv", desc: "Geçmiş parçalar", size: "md:col-span-2 md:row-span-1", href: "/archive" },
];

export default function Collections() {
  return (
    <section className="py-24 bg-fener-black">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black heading-style uppercase tracking-tight mb-16 text-center">
          Koleksiyonları <span className="text-white/30">Keşfet</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px]">
          {categories.map((cat, idx) => (
            <Link 
              href={cat.href} 
              key={cat.name}
              className={`group relative overflow-hidden bg-[#0a0a0a] border border-white/5 p-8 flex flex-col justify-end ${cat.size}`}
            >
              {/* Hover background effect */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* subtle grain inside */}
              <div className="absolute inset-0 bg-grain opacity-20"></div>

              <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="text-fener-gold text-xs uppercase tracking-widest font-bold mb-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                  {cat.desc}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold uppercase tracking-tighter heading-style">
                  {cat.name}
                </h3>
              </div>
              
              {/* Arrow icon */}
              <div className="absolute top-8 right-8 w-10 h-10 border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
