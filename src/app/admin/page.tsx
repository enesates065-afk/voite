"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Package, Loader2 } from "lucide-react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    recentActivities: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      let revenue = 0;
      let orderCount = 0;
      const activities: any[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        orderCount++;
        if (data.status === "Ödendi" || data.status === "Kargolandı" || data.status === "Teslim Edildi") {
          revenue += Number(data.total || 0);
        }

        if (activities.length < 5) {
          const date = data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date();
          activities.push({
            text: `Sipariş ${data.orderId || doc.id.slice(0,6)} - ${data.status}`,
            time: date.toLocaleDateString("tr-TR") + " " + date.toLocaleTimeString("tr-TR", { hour: '2-digit', minute:'2-digit' })
          });
        }
      });

      setMetrics({
        totalRevenue: revenue,
        totalOrders: orderCount,
        recentActivities: activities
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black heading-style uppercase tracking-tight">Genel Bakış</h1>
        <p className="text-white/50 text-sm mt-1">Mağazanızın bugünkü durumu.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Toplam Ciro", value: `$${metrics.totalRevenue}`, change: "Gerçek Veri", isPositive: true, icon: DollarSign },
          { title: "Siparişler", value: metrics.totalOrders.toString(), change: "Gerçek Veri", isPositive: true, icon: Package },
          { title: "Ziyaretçiler", value: "-", change: "Analitik Kurulmadı", isPositive: false, icon: Users },
          { title: "Dönüşüm Oranı", value: "-", change: "Analitik Kurulmadı", isPositive: true, icon: TrendingUp },
        ].map((metric, idx) => (
          <div key={idx} className="bg-[#0a0a0a] border border-white/10 p-6 rounded relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <metric.icon size={20} className="text-white" />
              <div className={`flex items-center gap-1 text-[10px] font-bold text-white/40 uppercase tracking-widest`}>
                {metric.change}
              </div>
            </div>
            <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">{metric.title}</h3>
            <p className="text-3xl font-mono font-bold">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Charts / Recent Activity Mock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 p-6 rounded h-96 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Satış Grafiği (Son 7 Gün)</h3>
          <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-4 border-b border-white/10 relative">
            {/* Fake chart bars for UI purpose, since we need timeseries aggregation */}
            {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
              <div key={i} className="w-full bg-white/5 hover:bg-white/20 transition-colors relative group" style={{ height: `${h}%` }}>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded">Grafik Eklenecek</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-white/30 uppercase font-mono mt-2 px-2">
            <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Son Siparişler</h3>
          <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">
            {metrics.recentActivities.length === 0 ? (
              <p className="text-white/40 text-sm">Henüz sipariş yok.</p>
            ) : (
              metrics.recentActivities.map((activity, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-white flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-white/80">{activity.text}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
