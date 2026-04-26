"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";

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
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
