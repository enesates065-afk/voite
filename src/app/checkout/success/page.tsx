"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Check, Package } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();
  const [copied, setCopied] = useState(false);
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    clearCart();

    // Try to get the last order ID from localStorage (set during checkout)
    const stored = localStorage.getItem("voite_last_order_id");
    if (stored) {
      setOrderId(stored);
      localStorage.removeItem("voite_last_order_id");
    }
  }, [clearCart]);

  const handleCopy = () => {
    if (!orderId) return;
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center px-4">
      <div className="text-center max-w-lg w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-light uppercase tracking-[0.2em] heading-style mb-3">
          Ödeme Alındı
        </h1>
        <p className="text-white/50 text-sm mb-10 tracking-wide">
          Siparişiniz başarıyla oluşturuldu. Kargoya verildiğinde bildirim alacaksınız.
        </p>

        {/* Order Code Box */}
        {orderId && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded p-6 mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-3">
              Sipariş Takip Kodunuz
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-2xl font-mono font-bold tracking-widest text-white">
                {orderId}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Kopyala"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 tracking-wide">
              Bu kodu saklayın — sipariş takibi için gerekli olacak.
            </p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link
              href={`/siparis-takibi?kod=${orderId}`}
              className="px-8 py-4 bg-white text-black font-light uppercase tracking-[0.2em] text-xs hover:bg-white/80 transition-colors flex items-center justify-center gap-2"
            >
              <Package size={16} />
              Siparişimi Takip Et
            </Link>
          )}
          <Link
            href="/"
            className="px-8 py-4 border border-white/20 text-white font-light uppercase tracking-[0.2em] text-xs hover:bg-white/5 transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
