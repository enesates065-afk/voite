"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Check, Loader2, Archive } from "lucide-react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  sizes: string[];
  image: string;
  stock: number;
  sizeStock?: Record<string, number>;
  seriesSlug?: string;
  dropNumber?: number;
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropArchived, setDropArchived] = useState(false);
  
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
            const data = { id: docSnap.id, ...docSnap.data() } as Product;
            setProduct(data);

            // If product belongs to a drop, check if that drop is archived
            if (data.seriesSlug && data.dropNumber) {
              const dropQ = query(
                collection(db, "drops"),
                where("seriesSlug", "==", data.seriesSlug),
                where("dropNumber", "==", data.dropNumber)
              );
              const dropSnap = await getDocs(dropQ);
              if (!dropSnap.empty) {
                const dropData = dropSnap.docs[0].data();
                setDropArchived(dropData.archived === true);
              }
            }
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
    if (!selectedSize) return;
    
    // Check per-size stock if available, otherwise fall back to total stock
    const sizeQty = product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) : product.stock;
    if (sizeQty === 0) return;
    
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
                className={`object-cover object-center transition-all duration-500 ${dropArchived ? "grayscale brightness-50" : ""}`}
                priority
              />
              {/* Archived overlay */}
              {dropArchived && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                  <div className="border border-white/15 px-6 py-3 text-center">
                    <p className="text-[9px] uppercase tracking-[0.5em] text-white/40 font-light">Arşivlendi</p>
                    <p className="text-[8px] uppercase tracking-widest text-white/20 mt-1 font-light">Bu parça artık satışta değil</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-center max-w-md lg:ml-12">
            
            <div className="mb-10">
              {/* Archived drop badge */}
              {dropArchived && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[8px] uppercase tracking-[0.4em] text-white/25 border border-white/10 px-3 py-1.5">
                    Arşiv — Artık Üretilmiyor
                  </span>
                </div>
              )}
              <h1 className="text-3xl lg:text-4xl font-light heading-style uppercase tracking-[0.1em] mb-4 text-white">
                {product.name}
              </h1>
              {/* Price display */}
              {dropArchived ? (
                <p className="text-lg font-light text-white/20 line-through">₺{product.price}</p>
              ) : product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price) ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-2xl font-light text-white">₺{parseInt(product.price).toLocaleString("tr-TR")}</span>
                  <span className="text-base font-light text-white/30 line-through">₺{parseInt(product.compareAtPrice).toLocaleString("tr-TR")}</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white bg-white/15 px-2.5 py-1">
                    %{Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)} İndirim
                  </span>
                </div>
              ) : (
                <p className="text-xl font-light text-white/60">₺{parseInt(product.price).toLocaleString("tr-TR")}</p>
              )}
            </div>

            <p className="text-white/50 font-light leading-relaxed mb-12 text-sm tracking-wide">
              {product.description}
            </p>

            {/* Size Selector — hidden if archived */}
            {!dropArchived && (
              <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Beden Seç</h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes && product.sizes.map((size) => {
                    const sizeQty = product.sizeStock ? (product.sizeStock[size] ?? 0) : product.stock;
                    const isSoldOut = sizeQty === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => !isSoldOut && setSelectedSize(size)}
                        disabled={isSoldOut}
                        className={`py-4 text-xs font-light tracking-[0.1em] border transition-all duration-500 relative ${
                          isSoldOut
                            ? 'border-white/5 text-white/20 cursor-not-allowed'
                            : selectedSize === size 
                              ? 'border-white bg-white text-black' 
                              : 'border-white/10 text-white/70 hover:border-white/30'
                        }`}
                      >
                        {size}
                        {isSoldOut && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="absolute w-full h-px bg-white/20 rotate-45" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart or Archived notice */}
            {dropArchived ? (
              <div className="w-full py-5 border border-white/5 flex items-center justify-center gap-3">
                <Archive size={14} className="text-white/15" />
                <span className="text-xs uppercase tracking-[0.25em] text-white/20 font-light">
                  Bu Parça Arşivlendi
                </span>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || (product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) === 0 : product.stock === 0)}
                className={`w-full py-5 text-xs font-light uppercase tracking-[0.2em] flex justify-center items-center gap-3 transition-all duration-700 ${
                  !selectedSize ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' :
                  (product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) : product.stock) === 0 ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' :
                  isAdded 
                    ? 'bg-white text-black' 
                    : 'bg-transparent text-white border border-white/20 hover:bg-white hover:text-black'
                }`}
              >
                {!selectedSize ? 'Beden Seçin' :
                 (product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) : product.stock) === 0 ? 'Bu Beden Tükendi' :
                 isAdded ? 'Eklendi' : 'Sepete Ekle'}
              </button>
            )}
            
            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col gap-3 text-[10px] text-white/30 uppercase tracking-[0.2em] font-light">
              <div className="flex items-center gap-3">
                {dropArchived ? (
                  <><span className="w-1.5 h-1.5 rounded-full bg-white/15" /> Arşivlendi — Satışta Değil</>
                ) : selectedSize ? (
                  <>
                    <span className={`w-1.5 h-1.5 rounded-full ${(product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) : product.stock) > 0 ? 'bg-white/60' : 'bg-red-500/50'}`} />
                    {(product.sizeStock ? (product.sizeStock[selectedSize] ?? 0) : product.stock) > 0
                      ? `${selectedSize} bedeni stokta mevcut`
                      : `${selectedSize} bedeni tükendi`}
                  </>
                ) : (
                  <><span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Beden seçin</>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
