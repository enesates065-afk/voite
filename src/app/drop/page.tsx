import DropSystem from "@/components/DropSystem";
import FeaturedProducts from "@/components/FeaturedProducts";

export const metadata = {
  title: "Drop 01 | VOITÉ.",
  description: "Sınırlı süreli koleksiyonumuz. Sadece 72 saat.",
};

export default function DropPage() {
  return (
    <div className="pt-24 bg-fener-black min-h-screen">
      <div className="container mx-auto px-6 mb-12">
        <h1 className="text-sm font-mono tracking-widest text-white/40 uppercase mb-4">LATEST DROP</h1>
      </div>
      
      <DropSystem />
      
      <div className="mt-12">
        <FeaturedProducts />
      </div>
    </div>
  );
}
