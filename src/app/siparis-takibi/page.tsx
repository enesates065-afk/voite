"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, Truck, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface Order {
  orderId: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  items: any[];
  total: number;
  createdAt?: any;
  paymentId?: string;
}

const STATUS_STEPS = [
  { key: "Bekliyor",     label: "Sipariş Alındı",   icon: Clock,       desc: "Siparişiniz alındı, hazırlanıyor." },
  { key: "Ödendi",       label: "Ödeme Onaylandı",  icon: CheckCircle2,desc: "Ödemeniz onaylandı." },
  { key: "Kargolandı",   label: "Kargoya Verildi",  icon: Truck,       desc: "Ürününüz kargoya verildi." },
  { key: "Teslim Edildi",label: "Teslim Edildi",    icon: Package,     desc: "Siparişiniz teslim edildi." },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get("kod") || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const initialCode = searchParams.get("kod");
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, []);

  const handleSearch = async (searchCode?: string) => {
    const trackCode = (searchCode || code).trim().toUpperCase();
    if (!trackCode) return;

    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);

    try {
      const q = query(collection(db, "orders"), where("orderId", "==", trackCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Bu koda ait sipariş bulunamadı. Kodu doğru girdiğinizden emin olun.");
      } else {
        const data = snap.docs[0].data();
        setOrder({
          orderId: data.orderId || trackCode,
          status: data.status || "Bekliyor",
          paymentStatus: data.paymentStatus || "Pending",
          customerName: data.customerName || "",
          items: data.items || [],
          total: data.total || 0,
          createdAt: data.createdAt,
          paymentId: data.paymentId,
        });
      }
    } catch (e) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const stepIdx = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-voite-black pt-32 pb-24 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light uppercase tracking-[0.3em] heading-style mb-3">
            Sipariş Takibi
          </h1>
          <p className="text-white/40 text-sm tracking-wide">
            Sipariş kodunuzu girerek siparişinizin durumunu öğrenin.
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-10">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="VOI-XXXXXX"
            className="flex-1 bg-[#0a0a0a] border border-white/10 rounded px-5 py-4 text-sm font-mono uppercase tracking-widest focus:border-white outline-none transition-colors text-white placeholder:text-white/20"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !code.trim()}
            className="px-6 py-4 bg-white text-black font-light uppercase tracking-[0.15em] text-xs hover:bg-white/80 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Sorgula
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6 flex items-center gap-3">
            <XCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Order Result */}
        {order && (
          <div className="space-y-6">

            {/* Order Info */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Sipariş No</p>
                  <p className="font-mono font-bold text-xl">{order.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-1">Tutar</p>
                  <p className="font-mono font-bold text-xl">₺{Number(order.total).toLocaleString("tr-TR")}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest ${
                order.status === "Teslim Edildi" ? "bg-green-500/20 text-green-400" :
                order.status === "Kargolandı" ? "bg-blue-500/20 text-blue-400" :
                order.status === "Ödendi" ? "bg-white/10 text-white/80" :
                order.status === "İptal Edildi" ? "bg-red-500/20 text-red-400" :
                "bg-yellow-500/20 text-yellow-400"
              }`}>
                {order.status}
              </div>
            </div>

            {/* Progress Steps */}
            {order.status !== "İptal Edildi" && (
              <div className="bg-[#0a0a0a] border border-white/10 rounded p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-8">Sipariş Durumu</h3>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />
                  <div
                    className="absolute left-4 top-4 w-px bg-white transition-all duration-1000"
                    style={{ height: `${Math.min(stepIdx / (STATUS_STEPS.length - 1), 1) * 100}%` }}
                  />

                  <div className="space-y-8">
                    {STATUS_STEPS.map((step, idx) => {
                      const isComplete = idx <= stepIdx;
                      const isCurrent = idx === stepIdx;
                      const Icon = step.icon;
                      return (
                        <div key={step.key} className="flex items-start gap-5 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border transition-all z-10 ${
                            isComplete
                              ? "bg-white border-white text-black"
                              : "bg-[#0a0a0a] border-white/20 text-white/20"
                          }`}>
                            <Icon size={14} />
                          </div>
                          <div className="pt-0.5">
                            <p className={`text-sm font-bold ${isComplete ? "text-white" : "text-white/30"}`}>
                              {step.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-white/50 mt-1">{step.desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            {order.items.length > 0 && (
              <div className="bg-[#0a0a0a] border border-white/10 rounded p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-4">Ürünler</h3>
                <div className="space-y-3">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold">{item.name}</p>
                        <p className="text-xs text-white/40">
                          {item.size && `Beden: ${item.size}`}{item.quantity && ` · ${item.quantity} adet`}
                        </p>
                      </div>
                      <p className="font-mono text-sm">₺{(item.price * item.quantity).toLocaleString("tr-TR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Empty state (searched but no result yet) */}
        {!searched && !order && (
          <div className="text-center py-12">
            <Package size={48} className="text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm tracking-wide">
              Sipariş kodunuzu yukarıya girin
            </p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/" className="text-white/30 hover:text-white text-xs uppercase tracking-[0.2em] transition-colors border-b border-white/20 pb-1">
            Ana Sayfaya Dön
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SiparisTakibiPage() {
  return (
    <Suspense>
      <TrackingContent />
    </Suspense>
  );
}
