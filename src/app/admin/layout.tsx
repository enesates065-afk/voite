import Link from "next/link";
import { LayoutDashboard, ShoppingCart, CreditCard, Package, LogOut, Layers, Tag } from "lucide-react";

export const metadata = {
  title: "VOITÉ. Admin",
  description: "VOITÉ. Yönetim Portalı",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row text-white font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-voite-black border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-8 border-b border-white/5">
          <Link href="/admin" className="text-xl font-light uppercase tracking-[0.2em] heading-style text-white">
            VOITÉ. <span className="text-white/30 text-xs tracking-widest block mt-1">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-6 space-y-4">
          <Link href="/admin" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <LayoutDashboard size={14} /> Dashboard
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <ShoppingCart size={14} /> Siparişler
          </Link>
          <Link href="/admin/payments" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <CreditCard size={14} /> Ödemeler
          </Link>
          <Link href="/admin/products" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <Package size={14} /> Ürünler
          </Link>
          <Link href="/admin/drops" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <Layers size={14} /> Seriler & Droplar
          </Link>
          <Link href="/admin/discount-codes" className="flex items-center gap-4 px-2 py-2 text-[10px] font-light uppercase tracking-[0.2em] text-white/50 hover:text-white transition-colors">
            <Tag size={14} /> İndirim Kodları
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
            <LogOut size={18} /> Siteye Dön
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-16 border-b border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-bold tracking-widest uppercase text-white/50">Yönetim Portalı</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs">A</div>
            <span className="text-sm font-bold">Admin</span>
          </div>
        </header>
        
        <div className="p-8 flex-1 bg-grain">
          {children}
        </div>
      </main>

    </div>
  );
}
