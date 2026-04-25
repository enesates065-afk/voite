"use client";

import { useState, useEffect } from "react";
import { Eye, Search, Filter, Loader2 } from "lucide-react";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: number;
  status: string;
  items: any[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
          customerName: orderData.customerName || "Anonim",
          customerEmail: orderData.customerEmail || "",
          date: orderData.createdAt ? new Date(orderData.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : "Tarih Yok",
          total: orderData.total || 0,
          status: orderData.status || "Bekliyor",
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
              className="w-full bg-[#0a0a0a] border border-white/10 text-sm py-2 pl-9 pr-4 rounded text-white focus:outline-none focus:border-fener-gold transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-fener-gold" size={32} />
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
                      <td className="px-6 py-4 font-mono font-bold text-fener-gold">{order.id.slice(0, 8)}...</td>
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
                        <button className="text-white/50 hover:text-white transition-colors" title="Detayları Gör">
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
    </div>
  );
}
