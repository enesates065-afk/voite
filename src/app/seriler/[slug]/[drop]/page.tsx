"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCartStore } from "@/store/useCartStore";
import { Loader2 } from "lucide-react";

const SERIES_META: Record<string, string> = {
  "silent-series": "Silent Series",
  "void-series": "Void Series",
};

export default function DropDetailPage() {
  const params = useParams();
  const seriesSlug = params?.slug as string;
  const dropParam = params?.drop as string; // "drop-1"
  const dropNumber = parseInt(dropParam?.replace("drop-", "") || "1");

  const [drop, setDrop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  const seriesTitle = SERIES_META[seriesSlug] || seriesSlug;

  useEffect(() => {
    const fetchDrop = async () => {
      try {
        // Get drop info
        const dropQ = query(
          collection(db, "drops"),
          where("seriesSlug", "==", seriesSlug),
          where("dropNumber", "==", dropNumber)
        );
        const dropSnap = await getDocs(dropQ);
        let dropData = null;
        if (!dropSnap.empty) {
          dropData = { id: dropSnap.docs[0].id, ...dropSnap.docs[0].data() };
          setDrop(dropData);
        }

        // Get products for this drop
        const prodQ = query(
          collection(db, "products"),
          where("seriesSlug", "==", seriesSlug),
          where("dropNumber", "==", dropNumber)
        );
        const prodSnap = await getDocs(prodQ);
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDrop();
  }, [seriesSlug, dropNumber]);

  if (loading) return (
    <div className="min-h-screen bg-voite-black flex items-center justify-center">
      <Loader2 className="animate-spin text-white/20" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-20">
          <Link href={`/seriler/${seriesSlug}`}
            className="text-[9px] uppercase tracking-[0.4em] text-white/20 hover:text-white/40 transition-colors mb-6 block">
            ← {seriesTitle}
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-5xl font-light heading-style uppercase tracking-tight mb-3">
                Drop {String(dropNumber).padStart(2, "0")}
              </h1>
              {drop?.description && (
                <p className="text-white/30 text-sm font-light max-w-lg">{drop.description}</p>
              )}
            </div>
            {drop?.active && !drop?.archived && (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Yayında</span>
              </div>
            )}
            {drop?.archived && (
              <span className="text-[10px] uppercase tracking-widest text-white/20 font-bold">Arşiv</span>
            )}
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-24 border border-white/5">
            <p className="text-white/20 uppercase tracking-widest text-sm">Ürün bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: any) => {
              const totalStock = product.sizeStock
                ? Object.values(product.sizeStock as Record<string,number>).reduce((a, b) => a + b, 0)
                : product.stock || 0;
              return (
                <Link key={product.id} href={`/product/${product.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] mb-4">
                    <Image
                      src={product.image || "/images/hoodie.png"}
                      alt={product.name} fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                    {totalStock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[9px] uppercase tracking-widest text-white/40">Tükendi</span>
                      </div>
                    )}
                    {totalStock > 0 && totalStock <= 5 && (
                      <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1">
                        <span className="text-[8px] uppercase tracking-widest text-yellow-400">Son {totalStock}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-xs uppercase tracking-[0.1em] text-white/70 group-hover:text-white transition-colors font-light">{product.name}</p>
                    <p className="text-xs font-mono text-white/50">₺{product.price}</p>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-white/20 mt-1">{product.category}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
