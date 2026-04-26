import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-voite-black pt-40 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl font-light heading-style uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">Gizlilik Politikası</h1>
          
          <div className="space-y-8 text-white/60 font-light leading-relaxed text-sm">
            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">1. Veri Toplama</h2>
              <p>
                VOITÉ, hizmetlerini sunabilmek ve siparişlerinizi işleme koyabilmek amacıyla ad, soyad, adres, e-posta adresi 
                ve iletişim bilgilerinizi toplar. Ödeme bilgileriniz güvenli ödeme altyapıları üzerinden işlenir ve sunucularımızda saklanmaz.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">2. Verilerin Kullanımı</h2>
              <p>
                Toplanan kişisel verileriniz yalnızca aşağıdaki amaçlarla kullanılır:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Siparişlerinizin alınması, teslim edilmesi ve faturalandırılması</li>
                <li>Müşteri hizmetleri desteği sağlanması</li>
                <li>İade ve değişim süreçlerinin yönetilmesi</li>
                <li>Onayınız dahilinde yeni koleksiyon ve drop duyurularının yapılması</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">3. Çerezler (Cookies)</h2>
              <p>
                Sitemizin daha verimli çalışabilmesi ve kullanıcı deneyiminizi geliştirmek amacıyla çerezler kullanılmaktadır. 
                Çerezler, alışveriş sepetinizin hatırlanması ve sitemizi nasıl kullandığınıza dair analitik verilerin 
                toplanmasına yardımcı olur. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">4. Üçüncü Taraflarla Paylaşım</h2>
              <p>
                Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir şekilde üçüncü şahıslara veya şirketlere satılmaz 
                veya pazarlama amacıyla paylaşılmaz. Sadece sipariş teslimatı için kargo şirketleri gibi gerekli hizmet 
                sağlayıcılarla sınırlı bilgi paylaşımı yapılmaktadır.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
