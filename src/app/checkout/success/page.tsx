"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";

export default function CheckoutSuccessPage() {
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-[#0a0a0a] border border-white/10 rounded">
        <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black uppercase heading-style mb-4">Ödeme Başarılı</h1>
        <p className="text-white/60 mb-8">Siparişiniz ve ödemeniz başarıyla alındı. En kısa sürede kargoya verilecektir.</p>
        <Link href="/" className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition-colors inline-block">
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
