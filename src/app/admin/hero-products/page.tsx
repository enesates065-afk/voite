"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Check, X, LayoutGrid, Save } from "lucide-react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category?: string;
  seriesSlug?: string;
}

const SLOT_LABELS = ["Sol Üst — 01.", "Sağ Üst — 02.", "Sol Alt — 03.", "Sağ Alt — 04."];

export default function HeroProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [slots, setSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [prodSnap, settingsDoc] = await Promise.all([
          getDocs(collection(db, "products")),
          getDoc(doc(db, "settings", "heroProducts")),
        ]);
        setAllProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        if (settingsDoc.exists() && settingsDoc.data().slots) {
          setSlots(settingsDoc.data().slots);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "heroProducts"), { slots, updatedAt: new Date() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const assignProduct = (productId: string) => {
    if (activeSlot === null) return;
    setSlots(s => s.map((v, i) => i === activeSlot ? productId : v));
    setActiveSlot(null);
  };

  const clearSlot = (slotIdx: number) => {
    setSlots(s => s.map((v, i) => i === slotIdx ? null : v));
  };

  const getProductById = (id: string | null) =>
    id ? allProducts.find(p => p.id === id) : null;

  const filtered = allProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Hero Ürünleri</h1>
          <p className="text-white/40 text-sm mt-1">Ana sayfada gösterilecek 4 cam çerçeve ürününü seçin.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-light uppercase tracking-[0.2em] transition-all ${
            saved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white text-black hover:bg-white/80"
          }`}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/20" size={28} /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-10">

          {/* LEFT: Slot visual preview */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/25 mb-6">Çerçeve Slotları</p>

            {/* Mini preview grid */}
            <div className="relative bg-[#050505] border border-white/5 rounded aspect-[16/9] mb-6 overflow-hidden">
              {/* Background visual hint */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[8px] uppercase tracking-widest text-white/8">VOITÉ.</p>
              </div>
              {/* 4 mini slot indicators */}
              {[
                { slot: 0, style: { top: "8%",  left: "5%",  width: "30%", height: "42%" } },
                { slot: 1, style: { top: "5%",  right: "5%", width: "28%", height: "40%" } },
                { slot: 2, style: { bottom: "8%", left: "6%",  width: "29%", height: "40%" } },
                { slot: 3, style: { bottom: "5%", right: "4%", width: "30%", height: "42%" } },
              ].map(({ slot, style }) => {
                const product = getProductById(slots[slot]);
                const isActive = activeSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setActiveSlot(isActive ? null : slot)}
                    className="absolute rounded overflow-hidden transition-all duration-200"
                    style={{
                      ...style,
                      border: isActive ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      background: isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                      boxShadow: isActive ? "0 0 20px rgba(255,255,255,0.08)" : "none",
                    }}
                  >
                    {product ? (
                      <>
                        <Image src={product.image || "/images/hoodie.png"} alt={product.name} fill
                          className="object-cover grayscale opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-1 left-2">
                          <p className="text-[6px] uppercase tracking-widest text-white/70 font-light truncate max-w-[80px]">
                            {product.name}
                          </p>
                        </div>
                        <div className="absolute top-1 right-1">
                          <p className="text-[6px] text-white/30">{["01","02","03","04"][slot]}.</p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <LayoutGrid size={10} className="text-white/20" />
                        <p className="text-[6px] uppercase tracking-widest text-white/20">
                          {["01","02","03","04"][slot]}.
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Slot list */}
            <div className="space-y-2">
              {SLOT_LABELS.map((label, i) => {
                const product = getProductById(slots[i]);
                const isActive = activeSlot === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-4 border rounded transition-colors cursor-pointer ${
                      isActive ? "border-white/30 bg-white/5" : "border-white/5 hover:border-white/10 bg-[#0a0a0a]"
                    }`}
                    onClick={() => setActiveSlot(isActive ? null : i)}
                  >
                    <span className="text-[10px] font-mono text-white/25 w-5">{String(i + 1).padStart(2, "0")}.</span>
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 mb-0.5">{label}</p>
                      {product ? (
                        <p className="text-xs text-white/70 font-light">{product.name}</p>
                      ) : (
                        <p className="text-[10px] text-white/20 italic">Ürün seçilmedi — tıkla seç</p>
                      )}
                    </div>
                    {product && (
                      <div className="relative w-10 h-12 overflow-hidden flex-shrink-0">
                        <Image src={product.image || "/images/hoodie.png"} alt={product.name}
                          fill className="object-cover grayscale opacity-60" />
                      </div>
                    )}
                    {product ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); clearSlot(i); }}
                        className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    ) : (
                      <span className="text-[9px] text-white/20 uppercase tracking-widest">Seç</span>
                    )}
                  </div>
                );
              })}
            </div>

            {activeSlot !== null && (
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30 mt-4 text-center animate-pulse">
                Slot {activeSlot + 1} seçili — sağdan ürün seçin
              </p>
            )}
          </div>

          {/* RIGHT: Product picker */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/25 mb-4">
              {activeSlot !== null ? `Slot ${activeSlot + 1} için ürün seç` : "Tüm Ürünler"}
            </p>

            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full bg-white/3 border border-white/10 p-3 text-sm focus:border-white outline-none text-white mb-4 placeholder:text-white/20"
            />

            <div className="grid grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 hide-scrollbar">
              {filtered.map(product => {
                const assignedSlot = slots.indexOf(product.id);
                const isAssigned = assignedSlot !== -1;
                const isTarget = activeSlot !== null && slots[activeSlot] === product.id;

                return (
                  <button
                    key={product.id}
                    onClick={() => activeSlot !== null && assignProduct(product.id)}
                    disabled={activeSlot === null}
                    className={`group relative text-left border rounded overflow-hidden transition-all duration-200 ${
                      activeSlot === null
                        ? "border-white/5 opacity-60 cursor-default"
                        : isTarget
                          ? "border-white/40 bg-white/8"
                          : "border-white/5 hover:border-white/25 hover:bg-white/5 cursor-pointer"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-[#0a0a0a]">
                      <Image src={product.image || "/images/hoodie.png"} alt={product.name}
                        fill className="object-cover grayscale opacity-50 group-hover:opacity-70 transition-opacity" />

                      {isAssigned && (
                        <div className="absolute top-2 right-2 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center">
                          <span className="text-[7px] font-bold">{assignedSlot + 1}</span>
                        </div>
                      )}

                      {activeSlot !== null && !isAssigned && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[9px] uppercase tracking-widest text-white">Seç</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-[9px] uppercase tracking-[0.1em] text-white/60 font-light truncate leading-snug">
                        {product.name}
                      </p>
                      <p className="text-[8px] font-mono text-white/25 mt-0.5">₺{product.price}</p>
                      {product.category && (
                        <p className="text-[7px] uppercase tracking-widest text-white/15 mt-0.5">{product.category}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
