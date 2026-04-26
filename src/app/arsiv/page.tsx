"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const SERIES_LABEL: Record<string, string> = {
  "silent-series": "Silent Series",
  "void-series": "Void Series",
};

interface ArchivedDrop {
  id: string;
  seriesSlug: string;
  seriesName: string;
  dropNumber: number;
  description: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  stock: number;
  sizeStock?: Record<string, number>;
}

export default function ArsivPage() {
  const [archivedDrops, setArchivedDrops] = useState<ArchivedDrop[]>([]);
  const [productsByDrop, setProductsByDrop] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchive = async () => {
      try {
        // Arşivlenen droplar — admin "Arşivle" butonuna bastığında archived: true olur
        const dropQ = query(collection(db, "drops"), where("archived", "==", true));
        const dropSnap = await getDocs(dropQ);
        const drops: ArchivedDrop[] = dropSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as ArchivedDrop)).sort((a, b) => b.dropNumber - a.dropNumber);

        setArchivedDrops(drops);

        // Her arşivlenen drop'un ürünlerini çek
        const prodMap: Record<string, Product[]> = {};
        await Promise.all(drops.map(async drop => {
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
    fetchArchive();
  }, []);

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-20 border-b border-white/5 pb-12">
          <p className="text-[9px] uppercase tracking-[0.5em] text-white/15 mb-4">Geçmiş</p>
          <h1 className="text-5xl font-light heading-style uppercase tracking-tight text-white/40 mb-4">
            Arşiv
          </h1>
          <p className="text-white/20 text-sm font-light max-w-lg leading-relaxed">
            Kapanmış droplar. Artık üretilmeyen parçalar. Tarihin bir parçası.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-white/10" size={28} />
          </div>
        ) : archivedDrops.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-white/10 uppercase tracking-[0.4em] text-sm">Henüz arşivlenen drop yok</p>
            <p className="text-white/10 text-xs mt-3 font-light">
              Admin panelinden bir drop'u arşivlediğinizde burada görünür.
            </p>
          </div>
        ) : (
          <div className="space-y-20">
            {archivedDrops.map(drop => {
              const products = productsByDrop[drop.id] || [];
              const seriesLabel = SERIES_LABEL[drop.seriesSlug] || drop.seriesName || drop.seriesSlug;

              return (
                <div key={drop.id} className="opacity-70 hover:opacity-100 transition-opacity duration-700">
                  {/* Drop label */}
                  <div className="flex items-end justify-between mb-8 pb-4 border-b border-white/5">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.45em] text-white/20 mb-2">{seriesLabel}</p>
                      <h2 className="text-2xl font-light heading-style uppercase tracking-wide text-white/50">
                        Drop {String(drop.dropNumber).padStart(2, "0")}
                      </h2>
                      {drop.description && (
                        <p className="text-white/20 text-xs font-light mt-1">{drop.description}</p>
                      )}
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-white/15 border border-white/10 px-3 py-1.5">
                      Arşivlendi
                    </span>
                  </div>

                  {/* Products */}
                  {products.length === 0 ? (
                    <p className="text-white/15 text-xs uppercase tracking-widest">Ürün bulunamadı</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {products.map(product => (
                        <Link key={product.id} href={`/product/${product.id}`} className="group">
                          <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] mb-3 grayscale brightness-50 group-hover:brightness-75 group-hover:grayscale-0 transition-all duration-700">
                            <Image
                              src={product.image || "/images/hoodie.png"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            {/* Sold out */}
                            <div className="absolute inset-0 flex items-end p-3">
                              <span className="text-[8px] uppercase tracking-widest text-white/30">Tükendi</span>
                            </div>
                          </div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-white/30 font-light group-hover:text-white/50 transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[9px] font-mono text-white/15 mt-0.5">₺{product.price}</p>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Link to full drop */}
                  <div className="mt-6">
                    <Link
                      href={`/seriler/${drop.seriesSlug}/drop-${drop.dropNumber}`}
                      className="text-[9px] uppercase tracking-[0.3em] text-white/15 hover:text-white/35 transition-colors border-b border-white/10 pb-0.5"
                    >
                      Drop Sayfasını Görüntüle →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
