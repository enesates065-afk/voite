import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Contact() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-voite-black pt-40 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl font-light heading-style uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">İletişim</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-light uppercase tracking-widest text-white/80 mb-6">Müşteri Hizmetleri</h2>
              <div className="space-y-4 text-white/50 font-light text-sm">
                <p>
                  <strong className="text-white/70">E-posta:</strong><br />
                  support@voite.co
                </p>
                <p>
                  <strong className="text-white/70">Çalışma Saatleri:</strong><br />
                  Pazartesi - Cuma<br />
                  09:00 - 18:00 (GMT+3)
                </p>
                <p className="mt-8 italic text-xs">
                  Tüm e-postalara 24 saat içerisinde dönüş yapılmaktadır.
                </p>
              </div>
            </div>

            <div>
              <form className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Adınız</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">E-posta Adresiniz</label>
                  <input type="email" className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Mesajınız</label>
                  <textarea rows={5} className="w-full bg-white/5 border border-white/10 rounded-none p-3 text-sm text-white focus:border-white focus:outline-none transition-colors" />
                </div>
                <button type="button" className="px-8 py-3 bg-white text-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/80 transition-colors w-full">
                  Mesajı Gönder
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
