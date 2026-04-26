"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1) Drops for this series
        const dropQ = query(collection(db, "drops"), where("seriesSlug", "==", slug));
        const dropSnap = await getDocs(dropQ);
        const dropData = dropSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => a.dropNumber - b.dropNumber);
        setDrops(dropData);

        // 2) ALL products in this series (regardless of dropNumber)
        const prodQ = query(collection(db, "products"), where("seriesSlug", "==", slug));
        const prodSnap = await getDocs(prodQ);
        const prodData = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(prodData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [slug]);

  // Products NOT assigned to any drop (standalone series products)
  const standaloneProducts = products.filter((p: any) => !p.dropNumber);
  // Products grouped by drop
  const productsByDrop = (dropNumber: number) =>
    products.filter((p: any) => p.dropNumber === dropNumber);

  if (loading) return (
    <div className="min-h-screen bg-voite-black flex items-center justify-center">
      <Loader2 className="animate-spin text-white/20" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Series Header */}
        <div className="mb-20 border-b border-white/5 pb-16">
          <Link href="/seriler" className="text-[9px] uppercase tracking-[0.4em] text-white/20 hover:text-white/40 transition-colors mb-6 block">
            ← Seriler
          </Link>
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 mb-4">Seri</p>
          <h1 className="text-5xl font-light heading-style uppercase tracking-tight mb-4">{meta.title}</h1>
          <p className="text-white/40 text-sm italic mb-3">{meta.tagline}</p>
          <p className="text-white/25 text-sm font-light max-w-lg leading-relaxed">{meta.description}</p>
        </div>

        {/* ─── DROPS (Limited, üstte) ─── */}
        {drops.length > 0 && (
          <div className="mb-24">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[10px] uppercase tracking-[0.35em] text-white/30 font-light">Limited Droplar</h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-3">
              {drops.map((drop: any) => {
                const dropProducts = productsByDrop(drop.dropNumber);
                const totalDropStock = dropProducts.reduce((sum: number, p: any) => {
                  if (p.sizeStock) return sum + Object.values(p.sizeStock as Record<string, number>).reduce((a, b) => a + b, 0);
                  return sum + (p.stock || 0);
                }, 0);

                return (
                  <Link key={drop.id}
                    href={`/seriler/${slug}/drop-${drop.dropNumber}`}
                    className="group flex items-center justify-between bg-[#050505] hover:bg-[#0a0a0a] transition-colors p-8 border border-white/5 hover:border-white/10">
                    <div className="flex items-center gap-8">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.35em] text-white/20 mb-2">
                          {drop.archived ? "Arşiv" : drop.active ? "Yayında" : "Yakında"}
                        </p>
                        <h3 className="text-xl font-light heading-style uppercase tracking-wide text-white">
                          Drop {String(drop.dropNumber).padStart(2, "0")}
                        </h3>
                        {drop.description && (
                          <p className="text-white/25 text-xs mt-1.5 font-light">{drop.description}</p>
                        )}
                      </div>
                      {dropProducts.length > 0 && (
                        <div className="hidden md:flex gap-2">
                          {dropProducts.slice(0, 3).map((p: any) => (
                            <div key={p.id} className="w-10 h-12 relative overflow-hidden bg-black/40 border border-white/5 rounded">
                              <Image src={p.image || "/images/hoodie.png"} alt={p.name} fill className="object-cover opacity-60" />
                            </div>
                          ))}
                          {dropProducts.length > 3 && (
                            <div className="w-10 h-12 bg-black/40 border border-white/5 rounded flex items-center justify-center">
                              <span className="text-[9px] text-white/30">+{dropProducts.length - 3}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      {drop.active && !drop.archived && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-[9px] uppercase tracking-widest text-green-400 font-bold">Aktif</span>
                        </div>
                      )}
                      {drop.archived && (
                        <span className="text-[9px] uppercase tracking-widest text-white/20">Arşiv</span>
                      )}
                      {dropProducts.length > 0 && (
                        <span className="text-[9px] text-white/20 uppercase tracking-widest hidden md:block">
                          {dropProducts.length} ürün
                        </span>
                      )}
                      <span className="text-white/15 group-hover:text-white/40 transition-colors text-xs uppercase tracking-widest">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ALL SERIES PRODUCTS (altta) ─── */}
        {products.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-[10px] uppercase tracking-[0.35em] text-white/30 font-light">
                {meta.title} — Tüm Ürünler
              </h2>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] text-white/20 uppercase tracking-widest">{products.length} parça</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product: any) => {
                const totalStock = product.sizeStock
                  ? Object.values(product.sizeStock as Record<string, number>).reduce((a, b) => a + b, 0)
                  : product.stock || 0;

                return (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.image}
                    stock={product.stock}
                    sizeStock={product.sizeStock}
                    category={product.category}
                    dropNumber={product.dropNumber}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && drops.length === 0 && products.length === 0 && (
          <div className="text-center py-32">
            <p className="text-white/15 uppercase tracking-widest text-sm">Henüz ürün eklenmedi</p>
            <p className="text-white/10 text-xs mt-2">Yakında duyurulacak.</p>
          </div>
        )}

      </div>
    </div>
  );
}
