import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  image: string;
  stock?: number;
  sizeStock?: Record<string, number>;
  category?: string;
  dropNumber?: number;
  className?: string;
}

function getDiscount(price: string, compareAtPrice?: string): number | null {
  if (!compareAtPrice) return null;
  const p = parseFloat(price);
  const c = parseFloat(compareAtPrice);
  if (!c || c <= p) return null;
  return Math.round((1 - p / c) * 100);
}

export function ProductCard({
  id, name, price, compareAtPrice, image,
  stock = 0, sizeStock, category, dropNumber, className = ""
}: ProductCardProps) {
  const totalStock = sizeStock && Object.keys(sizeStock).length > 0
    ? Object.values(sizeStock).reduce((a, b) => a + b, 0)
    : stock;

  const discount = getDiscount(price, compareAtPrice);
  const soldOut = totalStock === 0;
  const lowStock = totalStock > 0 && totalStock <= 5;

  return (
    <Link href={`/product/${id}`} className={`group ${className}`}>
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#0a0a0a] mb-3">
        <Image
          src={image || "/images/hoodie.png"}
          alt={name}
          fill
          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
        />

        {/* Discount badge — top left */}
        {discount && !soldOut && (
          <div className="absolute top-0 left-0 bg-white text-black px-2.5 py-1 z-10">
            <span className="text-[9px] font-black uppercase tracking-wider">%{discount} İndirim</span>
          </div>
        )}

        {/* Sold out */}
        {soldOut && (
          <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
            <span className="text-[9px] uppercase tracking-widest text-white/40">Tükendi</span>
          </div>
        )}

        {/* Low stock */}
        {lowStock && (
          <div className="absolute bottom-3 left-3 bg-black/80 px-2 py-1">
            <span className="text-[8px] uppercase tracking-widest text-yellow-400">Son {totalStock}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-[11px] uppercase tracking-[0.1em] text-white/60 group-hover:text-white transition-colors font-light leading-snug mb-1.5">
        {name}
      </p>

      {/* Price row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-white/80">
          ₺{parseInt(price).toLocaleString("tr-TR")}
        </span>
        {compareAtPrice && discount && (
          <>
            <span className="text-[10px] font-mono text-white/25 line-through">
              ₺{parseInt(compareAtPrice).toLocaleString("tr-TR")}
            </span>
            <span className="text-[8px] font-bold text-white bg-white/10 px-1.5 py-0.5">
              %{discount}
            </span>
          </>
        )}
      </div>

      {category && (
        <p className="text-[9px] uppercase tracking-widest text-white/15 mt-1">{category}</p>
      )}
    </Link>
  );
}
