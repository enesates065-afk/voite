import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Temel Parçalar | F-Editör",
  description: "Gardırobunuzun vazgeçilmez temel parçaları.",
};

const essentials = [
  { id: 1, name: "Klasik Siyah Tişört", price: "45", image: "/images/tshirt.png", slug: "klasik-siyah-tisort" },
  { id: 2, name: "Gri Kutu Kesim Hoodie", price: "95", image: "/images/hoodie.png", slug: "gri-kutu-kesim-hoodie" },
  { id: 3, name: "Logo İşlemeli Şapka", price: "35", image: "/images/tshirt.png", slug: "logo-islemeli-sapka" },
  { id: 4, name: "Premium Kargo Pantolon", price: "110", image: "/images/hoodie.png", slug: "premium-kargo-pantolon" },
];

export default function EssentialsPage() {
  return (
    <div className="pt-32 pb-24 bg-fener-black min-h-screen">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-20">
          <h1 className="text-5xl md:text-7xl font-black heading-style uppercase tracking-tighter mb-6">
            Temel <span className="text-white/30">Parçalar</span>
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed">
            Sezonsuz, zamansız, kusursuz kalıplar. Günlük üniformanız olması için yüksek gramajlı kumaşlarla üretildi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {essentials.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="relative aspect-[4/5] bg-[#0a0a0a] overflow-hidden rounded-sm mb-6 box-glow border border-white/5">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg heading-style tracking-tight group-hover:text-fener-gold transition-colors">{product.name}</h3>
                <span className="font-mono text-sm tracking-tighter text-white/70">${product.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
