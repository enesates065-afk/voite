import Image from "next/image";

export const metadata = {
  title: "Hakkımızda | F-Editör",
  description: "F-Editör'ün hikayesi. Dijital ruh, fiziksel form.",
};

export default function AboutPage() {
  return (
    <div className="pt-32 pb-32 bg-fener-black min-h-screen">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          <div className="flex-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-black heading-style uppercase tracking-tighter leading-none">
              Dijital <br />
              <span className="text-fener-gold text-glow">Ruh.</span>
            </h1>
            
            <div className="w-16 h-1 bg-white/20"></div>
            
            <div className="space-y-6 text-lg text-white/70 font-light leading-relaxed">
              <p>
                F-Editör sıradan bir giyim markası olarak başlamadı. Yüz binlerce insana ulaşan, ekranlar arkasında yaratılan dijital bir kültürün fiziksel bir yansıması olarak doğdu.
              </p>
              <p>
                Video editleri, sinematik vizyonlar ve sokak kültürünün birleştiği o anı yakalıyor ve giyilebilir bir kimliğe dönüştürüyoruz.
              </p>
              <p>
                Amacımız seri üretim yapmak değil; topluluğumuzu yansıtan, yüksek kaliteli, sınırlı sayıda "Drop"lar üreterek her bir parçanın bir sanat eseri veya dijital bir başyapıt gibi değer görmesini sağlamak.
              </p>
            </div>
            
            <div className="pt-8 grid grid-cols-2 gap-8 border-t border-white/10">
              <div>
                <span className="block text-4xl font-mono text-fener-gold mb-2">300K+</span>
                <span className="uppercase tracking-widest text-xs text-white/50">Topluluk Üyesi</span>
              </div>
              <div>
                <span className="block text-4xl font-mono text-fener-gold mb-2">01</span>
                <span className="uppercase tracking-widest text-xs text-white/50">Aktif Drop</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full aspect-[4/5] lg:aspect-square">
            <div className="absolute inset-0 bg-gradient-to-tr from-fener-gold/20 to-transparent z-10 mix-blend-overlay"></div>
            <Image
              src="/images/hero.png"
              alt="F-Editör Vision"
              fill
              className="object-cover object-center grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
