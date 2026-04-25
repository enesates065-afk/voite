"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  sizes: string[];
  image: string;
  stock: number;
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (typeof slug === "string") {
          const docRef = doc(db, "products", slug);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-voite-black pt-32 flex justify-center">
        <Loader2 className="animate-spin text-white/30" size={32} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-voite-black pt-32 text-center flex flex-col items-center justify-center">
        <h1 className="text-xl font-light uppercase tracking-[0.2em] text-white">Ürün Bulunamadı</h1>
        <Link href="/" className="text-white/40 hover:text-white uppercase tracking-[0.2em] text-xs mt-6 inline-block border-b border-white/20 pb-1 transition-colors">Ana Sayfaya Dön</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize || product.stock === 0) return;
    
    addItem({
      id: `${product.id}-${selectedSize}`,
      slug: product.id,
      name: product.name,
      price: parseInt(product.price),
      image: product.image,
      size: selectedSize,
      quantity: 1
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-voite-black min-h-screen pt-32 pb-32">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-[10px] text-white/30 tracking-[0.2em] uppercase mb-16 font-light">
          <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
          <span className="mx-3">/</span>
          <Link href="/shop" className="hover:text-white transition-colors">Mağaza</Link>
          <span className="mx-3">/</span>
          <span className="text-white/60">{product.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Images */}
          <div className="flex-1 lg:flex-[1.5]">
            <div className="relative aspect-[3/4] bg-[#030303] overflow-hidden">
              <Image 
                src={product.image || "/images/hoodie.png"} 
                alt={product.name} 
                fill 
                className="object-cover object-center"
                priority
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-center max-w-md lg:ml-12">
            
            <div className="mb-10">
              <h1 className="text-3xl lg:text-4xl font-light heading-style uppercase tracking-[0.1em] mb-4 text-white">
                {product.name}
              </h1>
              <p className="text-lg font-light text-white/60">${product.price}</p>
            </div>

            <p className="text-white/50 font-light leading-relaxed mb-12 text-sm tracking-wide">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Beden Seç</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes && product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-4 text-xs font-light tracking-[0.1em] border transition-all duration-500 ${
                      selectedSize === size 
                        ? 'border-white bg-white text-black' 
                        : 'border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && <p className="text-white/30 text-[10px] uppercase tracking-[0.1em] mt-3 opacity-0 transition-opacity" id="size-error">Lütfen beden seçin</p>}
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-5 text-xs font-light uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all duration-700 ${
                product.stock === 0 ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' :
                isAdded 
                  ? 'bg-white text-black' 
                  : 'bg-transparent text-white border border-white/20 hover:bg-white hover:text-black'
              }`}
            >
              {product.stock === 0 ? 'Tükendi' : isAdded ? 'Eklendi' : 'Sepete Ekle'}
            </button>
            
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-3 text-[10px] text-white/30 uppercase tracking-[0.2em] font-light">
              <div className="flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-white/60' : 'bg-red-500/50'}`}></span> 
                {product.stock > 0 ? 'Stokta mevcut' : 'Stokta yok'}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
