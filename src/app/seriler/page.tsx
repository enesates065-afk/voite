"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SERIES_META: Record<string, { title: string; description: string }> = {
  "silent-series": {
    title: "Silent Series",
    description: "Sessizlik bir tercih. Her parça minimalist bir manifesto.",
  },
  "void-series": {
    title: "Void Series",
    description: "Boşluktan doğan form. Tanımsız, özgün, sınırlı.",
  },
};

export default function SerilerPage() {
  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">Koleksiyonlar</p>
          <h1 className="text-4xl font-light heading-style uppercase tracking-tight">Seriler</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5">
          {Object.entries(SERIES_META).map(([slug, meta]) => (
            <Link key={slug} href={`/seriler/${slug}`}
              className="group bg-[#050505] p-12 hover:bg-[#0a0a0a] transition-colors">
              <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 mb-4 font-light">Seri</p>
              <h2 className="text-2xl font-light heading-style uppercase tracking-wide text-white group-hover:text-white/80 transition-colors mb-4">
                {meta.title}
              </h2>
              <p className="text-sm text-white/40 font-light leading-relaxed mb-8">{meta.description}</p>
              <span className="text-[10px] uppercase tracking-[0.25em] text-white/30 group-hover:text-white/60 transition-colors border-b border-white/10 pb-1">
                Keşfet →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
