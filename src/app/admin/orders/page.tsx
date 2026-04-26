"use client";

import { useState, useEffect } from "react";
import { Eye, Search, Filter, Loader2 } from "lucide-react";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Order {
  id: string;
  orderId?: string;
  paymentId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
  date: string;
  total: number;
  status: string;
  paymentStatus?: string;
  items: any[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: Order[] = [];
      querySnapshot.forEach((doc) => {
        const orderData = doc.data();
        data.push({
          id: doc.id,
          orderId: orderData.orderId || doc.id.slice(0, 8),
          paymentId: orderData.paymentId || "-",
          customerName: orderData.customerName || "Anonim",
          customerEmail: orderData.customerEmail || "",
          customerPhone: orderData.customerPhone || "-",
          address: orderData.address || "-",
          date: orderData.createdAt ? new Date(orderData.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : "Tarih Yok",
          total: orderData.total || 0,
          status: orderData.status || "Bekliyor",
          paymentStatus: orderData.paymentStatus || "-",
          items: orderData.items || []
        } as Order);
      });
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Durum güncellenirken hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Siparişler</h1>
          <p className="text-white/50 text-sm mt-1">Tüm müşteri siparişlerini yönetin.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input 
              type="text" 
              placeholder="Sipariş Ara..." 
              className="w-full bg-[#0a0a0a] border border-white/10 text-sm py-2 pl-9 pr-4 rounded text-white focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-xs border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Sipariş No</th>
                  <th className="px-6 py-4 font-bold">Müşteri</th>
                  <th className="px-6 py-4 font-bold">Tarih</th>
                  <th className="px-6 py-4 font-bold">Tutar</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-white/50">Henüz hiç sipariş yok.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">{order.orderId}</td>
                      <td className="px-6 py-4 text-white/80">{order.customerName}</td>
                      <td className="px-6 py-4 text-white/50">{order.date}</td>
                      <td className="px-6 py-4 font-mono">${order.total}</td>
                      <td className="px-6 py-4">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm outline-none appearance-none cursor-pointer ${
                            order.status === 'Bekliyor' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                            order.status === 'Kargolandı' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                            order.status === 'Teslim Edildi' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                            'bg-red-500/20 text-red-500 border border-red-500/30'
                          }`}
                        >
                          <option value="Bekliyor" className="bg-black text-white">Bekliyor</option>
                          <option value="Kargolandı" className="bg-black text-white">Kargolandı</option>
                          <option value="Teslim Edildi" className="bg-black text-white">Teslim Edildi</option>
                          <option value="İptal Edildi" className="bg-black text-white">İptal Edildi</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-white/50 hover:text-white transition-colors" title="Detayları Gör" onClick={() => setActiveOrder(order)}>
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold uppercase tracking-widest heading-style">Sipariş Detayı #{activeOrder.orderId}</h2>
              <button onClick={() => setActiveOrder(null)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">Müşteri Bilgileri</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="text-white/40">İsim:</span> {activeOrder.customerName}</p>
                    <p><span className="text-white/40">E-posta:</span> {activeOrder.customerEmail}</p>
                    <p><span className="text-white/40">Telefon:</span> {activeOrder.customerPhone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">Teslimat Adresi</h3>
                  <p className="text-sm whitespace-pre-wrap">{activeOrder.address}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">Sipariş Durumu</h3>
                  <p className="text-sm font-bold">{activeOrder.status}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-white/50 mb-2">Ödeme Durumu</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-bold">{activeOrder.paymentStatus}</p>
                    <p className="font-mono text-xs text-white/40">ID: {activeOrder.paymentId}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-xs uppercase tracking-widest text-white/50 mb-4">Ürünler</h3>
                <div className="space-y-4">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded">
                      <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-white/50">Beden: {item.size} | Adet: {item.quantity}</p>
                      </div>
                      <p className="font-mono text-sm">${item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-6 flex justify-between items-center">
                <span className="font-bold uppercase tracking-widest text-white/50">Toplam Tutar</span>
                <span className="text-2xl font-mono font-bold">${activeOrder.total}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
