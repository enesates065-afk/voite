"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  slug?: string;
  stock: number;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), limit(4));
        const querySnapshot = await getDocs(q);
        const data: Product[] = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            id: doc.id,
            name: docData.name,
            price: docData.price,
            image: docData.image || "/images/hoodie.png",
            slug: doc.id, // Using document ID as slug for simplicity
            stock: docData.stock || 0
          });
        });
        setProducts(data);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-32 bg-voite-black flex justify-center">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </section>
    );
  }

  return (
    <section className="py-32 bg-voite-black border-t border-white/5">
      <div className="container mx-auto px-6">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-light heading-style uppercase tracking-[0.2em] text-white">
              Series <span className="text-white/40">01</span>
            </h2>
          </div>
          <Link href="/shop" className="text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors border-b border-white/20 hover:border-white pb-1">
            Explore All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <Link href={`/product/${product.id}`} className="block relative aspect-[3/4] bg-[#030303] overflow-hidden mb-6">
                {/* Badge */}
                {product.stock <= 10 && product.stock > 0 && (
                  <div className="absolute top-4 left-4 z-20 text-[9px] font-light uppercase tracking-[0.2em] text-white/50 border border-white/20 px-2 py-1">
                    Limited
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute top-4 left-4 z-20 text-[9px] font-light uppercase tracking-[0.2em] text-white/30 border border-white/10 px-2 py-1">
                    Sold Out
                  </div>
                )}
                
                {/* Image */}
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>

              <div className="flex justify-between items-start mt-4">
                <div>
                  <h3 className="font-light text-sm tracking-[0.1em] uppercase text-white/80 group-hover:text-white transition-colors">{product.name}</h3>
                </div>
                <span className="font-light tracking-[0.1em] text-white/50 text-sm">₺{product.price}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
