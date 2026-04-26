"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);

    try {
      // API'ye ödeme başlatma isteği gönder
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          address: formData.address,
          items: items,
          total: getCartTotal()
        })
      });

      const data = await response.json();

      if (response.ok && data.paymentPageUrl) {
        // Iyzico ödeme sayfasına yönlendir
        window.location.href = data.paymentPageUrl;
      } else {
        alert(data.error || "Ödeme başlatılırken bir hata oluştu.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      alert("Sipariş oluşturulurken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-[#0a0a0a] border border-white/10 rounded">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black uppercase heading-style mb-4">Sipariş Alındı</h1>
          <p className="text-white/60 mb-8">Siparişiniz başarıyla oluşturuldu. En kısa sürede kargoya verilecektir.</p>
          <Link href="/" className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition-colors inline-block">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="text-white/10 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase heading-style mb-4 text-white/50">Sepetiniz Boş</h1>
          <Link href="/" className="text-white hover:text-white/70 hover:underline font-bold uppercase tracking-widest text-sm">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-4xl font-black uppercase heading-style mb-12">Ödeme Adımı</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Form */}
          <div className="flex-1">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Teslimat Bilgileri</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 font-bold mb-2">Ad Soyad</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 font-bold mb-2">E-posta</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 font-bold mb-2">Telefon (Başında 0 olmadan 5XX...)</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5551234567" className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 font-bold mb-2">Teslimat Adresi</label>
                <textarea required rows={4} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-4 text-sm focus:border-white outline-none" />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 mt-8 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Siparişi Tamamla"}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:w-[400px]">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 sticky top-24">
              <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Sipariş Özeti</h2>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto hide-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-black border border-white/5 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm uppercase">{item.name}</h3>
                      <p className="text-xs text-white/50">Beden: {item.size} | Adet: {item.quantity}</p>
                      <p className="font-mono text-sm mt-1">${item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Ara Toplam</span>
                  <span className="font-mono">${getCartTotal()}</span>
                </div>
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Kargo</span>
                  <span className="font-mono">Ücretsiz</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="font-bold uppercase tracking-widest">Toplam</span>
                <span className="font-mono text-2xl text-white font-bold">${getCartTotal()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
