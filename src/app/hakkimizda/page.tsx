import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Hakkımızda — VOITÉ.",
  description: "VOITÉ. — Sınırlı üretim, yüksek etki. Sessiz lüks streetwear.",
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <div className="space-y-10">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-light">Kimiz</p>
              <h1 className="text-5xl font-light heading-style uppercase tracking-tight leading-tight">
                Sessiz.<br />
                <span className="text-white/40">Sınırlı.</span><br />
                Seçilmiş.
              </h1>
            </div>

            <div className="w-12 h-px bg-white/20" />

            <div className="space-y-6 text-base text-white/60 font-light leading-relaxed">
              <p>
                VOITÉ. sıradan bir giyim markası olarak tasarlanmadı. Az üretim, yüksek etki felsefesiyle hareket eden bir kolektif.
              </p>
              <p>
                Her drop, özenle seçilmiş 3–4 parçadan oluşur. Seri üretim yoktur. Her parça kendi başına bir ifade biçimidir.
              </p>
              <p>
                Amacımız rafları doldurmak değil — doğru insanın elinde değer kazanan parçalar yaratmak.
              </p>
            </div>

            <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/10">
              <div>
                <span className="block text-4xl font-mono font-light text-white mb-2">Drop</span>
                <span className="uppercase tracking-widest text-xs text-white/30">Bazlı Koleksiyon</span>
              </div>
              <div>
                <span className="block text-4xl font-mono font-light text-white mb-2">01</span>
                <span className="uppercase tracking-widest text-xs text-white/30">Aktif Seri</span>
              </div>
            </div>

            <Link href="/drop" className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-white/50 hover:text-white transition-colors border-b border-white/20 pb-1">
              Aktif Drop'u Görüntüle
            </Link>
          </div>

          {/* Image */}
          <div className="relative w-full aspect-[4/5] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            <Image
              src="/images/hero.png"
              alt="VOITÉ. Vision"
              fill
              className="object-cover object-center grayscale"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
