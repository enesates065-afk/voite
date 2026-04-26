"use client";

import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutErrorPage() {
  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-[#0a0a0a] border border-white/10 rounded">
        <XCircle size={64} className="text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-black uppercase heading-style mb-4">Ödeme Başarısız</h1>
        <p className="text-white/60 mb-8">Ödeme işleminiz sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.</p>
        <Link href="/checkout" className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/80 transition-colors inline-block">
          Tekrar Dene
        </Link>
      </div>
    </div>
  );
}
