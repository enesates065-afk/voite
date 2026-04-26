"use client";

import { useState, useEffect } from "react";
import { Download, CreditCard, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Order {
  id: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  createdAt?: any;
  items: any[];
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"completed" | "pending">("completed");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data: Order[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        data.push({
          id: doc.id,
          orderId: d.orderId || doc.id.slice(0, 8),
          customerName: d.customerName || "Anonim",
          customerEmail: d.customerEmail || "",
          total: d.total || 0,
          status: d.status || "Bekliyor",
          paymentStatus: d.paymentStatus || "Pending",
          paymentId: d.paymentId || "-",
          createdAt: d.createdAt,
          items: d.items || [],
        });
      });
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completedOrders = orders.filter(o =>
    o.paymentStatus === "Success" || o.status === "Ödendi" || o.status === "Kargolandı" || o.status === "Teslim Edildi"
  );

  const pendingOrders = orders.filter(o =>
    o.paymentStatus === "Pending" && o.status === "Bekliyor"
  );

  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const formatDate = (ts: any) => {
    if (!ts) return "-";
    const d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Ödemeler</h1>
          <p className="text-white/50 text-sm mt-1">Iyzico ödeme geçmişi ve bekleyen işlemler.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded">
          <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Tamamlanan Ödemeler</h3>
          <p className="text-3xl font-mono font-bold">₺{totalRevenue.toLocaleString("tr-TR")}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-green-500/30 p-6 rounded">
          <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Başarılı İşlem</h3>
          <p className="text-3xl font-mono font-bold text-green-400">{completedOrders.length}</p>
        </div>
        <div className="bg-[#0a0a0a] border border-yellow-500/30 p-6 rounded">
          <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Yarıda Bırakılan</h3>
          <p className="text-3xl font-mono font-bold text-yellow-400">{pendingOrders.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setTab("completed")}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${
            tab === "completed" ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Tamamlanan Ödemeler ({completedOrders.length})
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-colors border-b-2 ${
            tab === "pending" ? "border-yellow-400 text-yellow-400" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Yarıda Bırakılan ({pendingOrders.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded overflow-hidden min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-white/30" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-xs border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Sipariş No</th>
                  <th className="px-6 py-4 font-bold">Müşteri</th>
                  <th className="px-6 py-4 font-bold">Tutar</th>
                  <th className="px-6 py-4 font-bold">Ödeme ID</th>
                  <th className="px-6 py-4 font-bold">Tarih</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(tab === "completed" ? completedOrders : pendingOrders).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                      {tab === "completed" ? "Henüz tamamlanan ödeme yok." : "Yarıda bırakılan sipariş yok."}
                    </td>
                  </tr>
                ) : (
                  (tab === "completed" ? completedOrders : pendingOrders).map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">{order.orderId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white/80">{order.customerName}</p>
                          <p className="text-xs text-white/40 font-mono">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold">₺{Number(order.total).toLocaleString("tr-TR")}</td>
                      <td className="px-6 py-4 font-mono text-white/40 text-xs">{order.paymentId || "-"}</td>
                      <td className="px-6 py-4 text-white/50">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4">
                        {tab === "completed" ? (
                          <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-widest">
                            <CheckCircle size={14} /> Ödendi
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold uppercase tracking-widest">
                            <Clock size={14} /> Bekliyor
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
