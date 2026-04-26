import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Returns() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-voite-black pt-40 pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-4xl font-light heading-style uppercase tracking-[0.2em] mb-12 border-b border-white/10 pb-6">İade Politikası</h1>
          
          <div className="space-y-8 text-white/60 font-light leading-relaxed text-sm">
            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">İade Koşulları</h2>
              <p>
                Satın aldığınız ürünleri, teslimat tarihinden itibaren 14 gün içerisinde iade edebilirsiniz. 
                İade edilecek ürünlerin kullanılmamış, etiketi koparılmamış ve tekrar satılabilir durumda olması gerekmektedir.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">İade Süreci</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>İade talebinizi support@voite.co adresine sipariş numaranız ile birlikte iletin.</li>
                <li>Size ileteceğimiz ücretsiz iade kargo kodu ile ürünü paketleyerek anlaşmalı kargo firmasına teslim edin.</li>
                <li>Ürün depomuza ulaştıktan sonra kalite kontrol sürecinden geçecektir.</li>
                <li>Onaylanan iadelerin ücret iadesi, 3-5 iş günü içerisinde ödeme yaptığınız yönteme gerçekleştirilecektir.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">Değişim İşlemleri</h2>
              <p>
                Şu an için doğrudan değişim işlemi yapılmamaktadır. Beden veya ürün değişikliği için mevcut siparişinizi 
                iade edip yeni bir sipariş oluşturmanız gerekmektedir. Limited Edition (Sınırlı Üretim) koleksiyonlarda 
                stok garantisi verilememektedir.
              </p>
            </section>

            <section>
              <h2 className="text-lg text-white mb-4 uppercase tracking-widest">İade Edilemeyen Ürünler</h2>
              <p>
                Hijyen koşulları gereği iç giyim, çorap ve aksesuar ürünlerinde ambalajı açılmış ürünlerin iadesi kabul edilmemektedir.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
