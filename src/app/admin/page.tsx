import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Package } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black heading-style uppercase tracking-tight">Genel Bakış</h1>
        <p className="text-white/50 text-sm mt-1">Mağazanızın bugünkü durumu.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Toplam Ciro", value: "$12,450", change: "+14%", isPositive: true, icon: DollarSign },
          { title: "Siparişler", value: "84", change: "+5%", isPositive: true, icon: Package },
          { title: "Ziyaretçiler", value: "3,210", change: "-2%", isPositive: false, icon: Users },
          { title: "Dönüşüm Oranı", value: "2.6%", change: "+0.4%", isPositive: true, icon: TrendingUp },
        ].map((metric, idx) => (
          <div key={idx} className="bg-[#0a0a0a] border border-white/10 p-6 rounded relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <metric.icon size={20} className="text-fener-gold" />
              <div className={`flex items-center gap-1 text-xs font-bold ${metric.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change}
                {metric.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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
            {/* Fake chart bars */}
            {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
              <div key={i} className="w-full bg-white/5 hover:bg-fener-gold/50 transition-colors relative group" style={{ height: `${h}%` }}>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black px-2 py-1 rounded">${h * 12}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-white/30 uppercase font-mono mt-2 px-2">
            <span>Pzt</span><span>Sal</span><span>Çar</span><span>Per</span><span>Cum</span><span>Cmt</span><span>Paz</span>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Son Aktiviteler</h3>
          <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar">
            {[
              { text: "Yeni sipariş #1042", time: "5 dk önce" },
              { text: "Stripe ödemesi alındı ($120)", time: "15 dk önce" },
              { text: "Sipariş #1039 kargolandı", time: "1 saat önce" },
              { text: "Yeni kullanıcı kaydı", time: "2 saat önce" },
              { text: "Stok uyarısı: Siyah Tişört", time: "5 saat önce" },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-fener-gold flex-shrink-0"></div>
                <div>
                  <p className="text-sm text-white/80">{activity.text}</p>
                  <p className="text-[10px] text-white/40 font-mono mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
