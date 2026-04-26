"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { CheckCircle2, Loader2, ShoppingBag, Tag, X, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CheckoutPage() {
  const { items, getCartTotal } = useCartStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // Discount code state
  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    codeId: string;
    discountAmount: number;
    finalTotal: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  const cartTotal = getCartTotal();
  const finalTotal = appliedCoupon ? appliedCoupon.finalTotal : cartTotal;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!formData.email) {
      setCouponError("Lütfen önce e-posta adresinizi girin.");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim(),
          email: formData.email,
          cartItems: items,
          cartTotal,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          codeId: data.codeId,
          discountAmount: data.discountAmount,
          finalTotal: data.finalTotal,
          message: data.message,
        });
        setCouponInput("");
      } else {
        setCouponError(data.error || "Geçersiz kod.");
      }
    } catch {
      setCouponError("Bir hata oluştu.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          address: formData.address,
          items,
          total: finalTotal,
          originalTotal: cartTotal,
          couponCode: appliedCoupon?.code || null,
          couponId: appliedCoupon?.codeId || null,
          discountAmount: appliedCoupon?.discountAmount || 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.paymentPageUrl) {
        window.location.href = data.paymentPageUrl;
      } else {
        alert(data.error || "Ödeme başlatılırken bir hata oluştu.");
        setLoading(false);
      }
    } catch (error: any) {
      alert("Sipariş oluşturulurken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag size={64} className="text-white/10 mx-auto mb-6" />
          <h1 className="text-2xl font-light uppercase heading-style mb-4 text-white/40 tracking-[0.1em]">Sepetiniz Boş</h1>
          <Link href="/" className="text-white/30 hover:text-white uppercase tracking-[0.2em] text-xs border-b border-white/15 pb-1 transition-colors">
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-3xl font-light uppercase heading-style tracking-[0.1em] mb-12">Ödeme</h1>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Form */}
          <div className="flex-1">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-8 pb-4 border-b border-white/5">Teslimat Bilgileri</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: "Ad Soyad", key: "name", type: "text", required: true },
                { label: "E-posta", key: "email", type: "email", required: true },
                { label: "Telefon (5XX...)", key: "phone", type: "tel", required: true, placeholder: "5551234567" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">{field.label}</label>
                  <input
                    required={field.required}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-white/3 border border-white/10 p-4 text-sm focus:border-white outline-none transition-colors text-white"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Teslimat Adresi</label>
                <textarea
                  required rows={4}
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-white/3 border border-white/10 p-4 text-sm focus:border-white outline-none transition-colors text-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 mt-4 bg-white text-black font-light uppercase tracking-[0.2em] text-sm hover:bg-white/80 transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : `Ödeme Yap — ₺${finalTotal.toLocaleString("tr-TR")}`}
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="lg:w-[380px]">
            <div className="bg-[#0a0a0a] border border-white/5 p-6 sticky top-24 space-y-6">

              <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/30 pb-4 border-b border-white/5">Sipariş Özeti</h2>

              {/* Cart Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto hide-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-14 h-18 bg-black border border-white/5 flex-shrink-0 aspect-[3/4] w-12">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-light text-xs uppercase tracking-[0.1em] text-white/80">{item.name}</h3>
                      <p className="text-[10px] text-white/30 mt-0.5">Beden: {item.size} · {item.quantity} adet</p>
                      <p className="font-mono text-xs text-white/50 mt-1">₺{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Input */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-3 flex items-center gap-2">
                  <Tag size={11} /> İndirim Kodu
                </p>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-green-400" />
                      <span className="font-mono text-sm font-bold text-white">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-green-400 uppercase tracking-widest">{appliedCoupon.message.split("(")[0]}</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-white/30 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      placeholder="VOITEXXXX"
                      className="flex-1 bg-white/3 border border-white/10 p-3 text-sm font-mono uppercase focus:border-white outline-none transition-colors text-white placeholder:text-white/15 tracking-widest"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-3 border border-white/10 text-[10px] uppercase tracking-widest text-white/40 hover:text-white hover:border-white/30 transition-colors disabled:opacity-30"
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Uygula"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-400/80 text-[10px] mt-2 font-light">{couponError}</p>
                )}
                {!formData.email && !couponError && (
                  <p className="text-white/15 text-[9px] mt-1">Kod uygulamak için e-posta gerekli.</p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-white/5 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-white/40 font-light">
                  <span>Ara Toplam</span>
                  <span className="font-mono">₺{cartTotal.toLocaleString("tr-TR")}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-400 font-light">
                    <span>İndirim ({appliedCoupon.code})</span>
                    <span className="font-mono">−₺{appliedCoupon.discountAmount.toLocaleString("tr-TR")}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/40 text-sm font-light">
                  <span>Kargo</span>
                  <span className="font-mono">Ücretsiz</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Toplam</span>
                <div className="text-right">
                  {appliedCoupon && (
                    <p className="text-white/20 line-through text-xs font-mono">₺{cartTotal.toLocaleString("tr-TR")}</p>
                  )}
                  <span className="font-mono text-2xl text-white font-light">₺{finalTotal.toLocaleString("tr-TR")}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
