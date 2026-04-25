import Image from "next/image";

export const metadata = {
  title: "Arşiv | F-Editör",
  description: "Geçmiş koleksiyonlar ve tükenen parçalar.",
};

const archiveItems = [
  { id: 1, name: "Drop 00 - Origin", status: "Arşivlendi", image: "/images/poster.png" },
  { id: 2, name: "Kış '25 Kapsül", status: "Tükendi", image: "/images/hoodie.png" },
  { id: 3, name: "Editör Özel Ceket", status: "1/1 Parça", image: "/images/tshirt.png" },
];

export default function ArchivePage() {
  return (
    <div className="pt-32 pb-24 bg-fener-black min-h-screen">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl font-black heading-style uppercase tracking-tighter mb-6 text-white/30">
            Arşiv
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed">
            Geçmiş koleksiyonlarımız, tükenen parçalarımız ve markamızın evrimi. Bu parçalar artık üretilmemektedir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 opacity-70 grayscale hover:grayscale-0 transition-all duration-1000">
          {archiveItems.map((item) => (
            <div key={item.id} className="group relative aspect-[3/4] overflow-hidden border border-white/10">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover object-center brightness-50 group-hover:brightness-100 transition-all duration-700"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                <h3 className="text-2xl font-bold uppercase tracking-widest text-white mb-2">{item.name}</h3>
                <span className="text-fener-gold tracking-[0.3em] uppercase text-xs">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
