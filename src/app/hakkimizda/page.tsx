import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Hakkımızda — VOITÉ.",
  description: "VOITÉ. — Az üretim, yüksek etki. Drop bazlı sessiz lüks.",
};

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-20 items-center">

          {/* Text */}
          <div className="space-y-12">
            <div className="space-y-5">
              <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 font-light">Manifesto</p>
              <h1 className="text-5xl md:text-6xl font-light heading-style uppercase tracking-tight leading-[1.1]">
                Az.<br />
                <span className="text-white/25">Özel.</span><br />
                Seçilmiş.
              </h1>
            </div>

            <div className="w-10 h-px bg-white/15" />

            <div className="space-y-6 text-sm text-white/40 font-light leading-loose">
              <p>
                VOITÉ. bir giyim markası değil — bir duruş. Seri üretimin karşısında, bilerek az üretiyor, bilerek sınırlı tutuyoruz.
              </p>
              <p>
                Her drop, birkaç parçadan oluşur. Stok bitmeden alınmayan parça, sonsuza dek arşive gider. Geri dönüşü yoktur.
              </p>
              <p>
                Tasarımda sessizliği, malzemede kaliteyi, erişimde kısıtı tercih ediyoruz. Kalabalıktan ayrışmak için değil — kalabalığa gerek duymamak için.
              </p>
            </div>

            {/* Stats */}
            <div className="pt-8 grid grid-cols-3 gap-6 border-t border-white/5">
              <div>
                <span className="block text-3xl font-mono font-light text-white/80 mb-1.5">Drop</span>
                <span className="uppercase tracking-widest text-[9px] text-white/20">Bazlı Yapı</span>
              </div>
              <div>
                <span className="block text-3xl font-mono font-light text-white/80 mb-1.5">3–4</span>
                <span className="uppercase tracking-widest text-[9px] text-white/20">Ürün / Drop</span>
              </div>
              <div>
                <span className="block text-3xl font-mono font-light text-white/80 mb-1.5">∞</span>
                <span className="uppercase tracking-widest text-[9px] text-white/20">Sıfır İade</span>
              </div>
            </div>

            <Link
              href="/drop"
              className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/30 hover:text-white transition-colors duration-300 border-b border-white/10 pb-1 group"
            >
              Aktif Drop'u Görüntüle
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          </div>

          {/* Image */}
          <div className="relative w-full aspect-[4/5] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent z-10" />
            <Image
              src="/images/hero.png"
              alt="VOITÉ."
              fill
              className="object-cover object-center grayscale"
            />
            {/* Bottom label */}
            <div className="absolute bottom-6 left-6 z-20">
              <p className="text-[8px] uppercase tracking-[0.4em] text-white/20 font-light">VOITÉ.</p>
              <p className="text-[8px] uppercase tracking-[0.3em] text-white/10">— Sessiz Lüks</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
