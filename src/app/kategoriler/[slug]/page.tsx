"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  "hoodie": { title: "Hoodie", description: "Oversize formlar, premium dokular." },
  "sweatshirt": { title: "Sweatshirt", description: "Minimalist kesimler, sınırlı üretim." },
  "t-shirt": { title: "T-Shirt", description: "Temel ama sıradan değil." },
  "pantolon": { title: "Pantolon", description: "Yapısal siluetler, konforlu kesim." },
  "aksesuar": { title: "Aksesuar", description: "Tamamlayıcı detaylar." },
};

export default function KategoriPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const meta = CATEGORY_META[slug] || { title: slug, description: "" };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", slug));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(data);
      } catch (e) {
        // Try with categories array
        try {
          const q2 = query(collection(db, "products"), where("categories", "array-contains", slug));
          const snap2 = await getDocs(q2);
          setProducts(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch { setProducts([]); }
      } finally { setLoading(false); }
    };
    fetchProducts();
  }, [slug]);

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-16 border-b border-white/5 pb-12">
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 mb-4">Kategori</p>
          <h1 className="text-4xl font-light heading-style uppercase tracking-tight mb-3">{meta.title}</h1>
          <p className="text-white/30 text-sm font-light">{meta.description}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-white/20" size={32} /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/20 uppercase tracking-widest text-sm">Bu kategoride ürün yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] mb-4">
                  <Image
                    src={product.image || "/images/hoodie.png"}
                    alt={product.name}
                    fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  {(product.stock === 0 || (product.sizeStock && Object.values(product.sizeStock as Record<string,number>).every(v => v === 0))) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-[9px] uppercase tracking-widest text-white/50">Tükendi</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start">
                  <p className="text-xs uppercase tracking-[0.1em] text-white/70 group-hover:text-white transition-colors font-light">{product.name}</p>
                  <p className="text-xs font-mono text-white/50">₺{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
