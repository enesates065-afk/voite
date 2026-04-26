import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-voite-black pt-40 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl font-light heading-style uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">Kullanım Koşulları</h1>
          
          <div className="space-y-8 text-white/60 font-light leading-relaxed text-sm">
            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">1. Taraflar ve Sözleşmenin Konusu</h2>
              <p>
                Bu Kullanım Koşulları, VOITÉ web sitesini kullanan tüm ziyaretçiler ve alışveriş yapan müşteriler için 
                geçerlidir. Siteyi kullanmanız, bu koşulları kabul ettiğiniz anlamına gelir.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">2. Fikri Mülkiyet Hakları</h2>
              <p>
                VOITÉ web sitesinde yer alan tüm logo, tasarım, metin, görsel ve içerikler VOITÉ markasına aittir ve 
                telif hakları ile korunmaktadır. Önceden yazılı izin alınmaksızın bu içeriklerin kopyalanması, 
                çoğaltılması veya ticari amaçla kullanılması yasaktır.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">3. Sipariş ve Fiyatlandırma</h2>
              <p>
                VOITÉ, site üzerinde yer alan fiyatları, kampanyaları ve ürün özelliklerini önceden haber vermeksizin 
                değiştirme hakkını saklı tutar. Bir sipariş onaylanana kadar sistemdeki fiyat hatalarından veya stok 
                yetersizliklerinden dolayı siparişi iptal etme hakkına sahiptir.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">4. Sorumluluk Reddi</h2>
              <p>
                VOITÉ, sitenin kesintisiz ve hatasız çalışacağını garanti etmez. Siteye erişimden, içerik hatalarından 
                veya üçüncü taraf bağlantılardan doğabilecek doğrudan veya dolaylı zararlardan VOITÉ sorumlu tutulamaz.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
