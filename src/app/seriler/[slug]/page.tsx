"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const SERIES_META: Record<string, { title: string; description: string; tagline: string }> = {
  "silent-series": {
    title: "Silent Series",
    tagline: "Sessizlik bir tercih.",
    description: "Minimal formlar. Gereksiz hiçbir şey. Sadece özün kendisi.",
  },
  "void-series": {
    title: "Void Series",
    tagline: "Boşluktan doğan form.",
    description: "Tanımsız, özgün, sınırlı. Void, boşluğu doldurmaz — onu tanımlar.",
  },
};

export default function SeriesPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const meta = SERIES_META[slug] || { title: slug, tagline: "", description: "" };

  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(collection(db, "drops"), where("seriesSlug", "==", slug));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDrops(data.sort((a: any, b: any) => a.dropNumber - b.dropNumber));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [slug]);

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Series Header */}
        <div className="mb-20 border-b border-white/5 pb-16">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 mb-4">Seri</p>
          <h1 className="text-5xl font-light heading-style uppercase tracking-tight mb-4">{meta.title}</h1>
          <p className="text-white/40 text-sm italic mb-6">{meta.tagline}</p>
          <p className="text-white/30 text-sm font-light max-w-lg leading-relaxed">{meta.description}</p>
        </div>

        {/* Drops */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-white/20" size={32} />
          </div>
        ) : drops.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/20 uppercase tracking-widest text-sm">Henüz drop yok</p>
            <p className="text-white/10 text-xs mt-2">Yakında duyurulacak.</p>
          </div>
        ) : (
          <div className="space-y-px">
            {drops.map((drop: any) => (
              <Link key={drop.id}
                href={`/seriler/${slug}/drop-${drop.dropNumber}`}
                className="group flex items-center justify-between bg-[#050505] hover:bg-[#0a0a0a] transition-colors p-8 border border-white/5 hover:border-white/10">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.35em] text-white/20 mb-2">
                    {drop.archived ? "Arşiv" : drop.active ? "Yayında" : "Yakında"}
                  </p>
                  <h2 className="text-xl font-light heading-style uppercase tracking-wide text-white">
                    Drop {String(drop.dropNumber).padStart(2, "0")}
                  </h2>
                  {drop.description && (
                    <p className="text-white/30 text-xs mt-2 font-light">{drop.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {drop.active && !drop.archived && (
                    <span className="text-[9px] uppercase tracking-widest text-green-400 font-bold">Aktif</span>
                  )}
                  <span className="text-white/20 group-hover:text-white/50 transition-colors text-xs uppercase tracking-widest">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
