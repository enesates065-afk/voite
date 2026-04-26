"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Loader2, Tag, Users, TrendingDown } from "lucide-react";
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const PRODUCT_CATEGORIES = [
  { label: "Hoodie", value: "hoodie" },
  { label: "Sweatshirt", value: "sweatshirt" },
  { label: "T-Shirt", value: "t-shirt" },
  { label: "Pantolon", value: "pantolon" },
  { label: "Aksesuar", value: "aksesuar" },
];

interface DiscountCode {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  applicableCategories: string[]; // empty = all non-drop categories
  active: boolean;
  createdAt?: any;
}

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  applicableCategories: [] as string[],
  active: true,
};

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCodes(); }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "discountCodes"));
      const data: DiscountCode[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as DiscountCode));
      setCodes(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = "VOITE" + Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(f => ({ ...f, code }));
  };

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(cat)
        ? f.applicableCategories.filter(c => c !== cat)
        : [...f.applicableCategories, cat],
    }));
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.value || !form.maxUses) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxUses: parseInt(form.maxUses),
        applicableCategories: form.applicableCategories,
        active: form.active,
        ...(editId ? {} : { usedCount: 0, usedBy: [], createdAt: new Date() }),
      };

      if (editId) {
        await updateDoc(doc(db, "discountCodes", editId), payload);
        setCodes(codes.map(c => c.id === editId ? { ...c, ...payload } : c));
      } else {
        const ref = await addDoc(collection(db, "discountCodes"), payload);
        setCodes([{ id: ref.id, usedCount: 0, usedBy: [], ...payload } as DiscountCode, ...codes]);
      }
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleEdit = (c: DiscountCode) => {
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrderAmount: String(c.minOrderAmount || ""),
      maxUses: String(c.maxUses),
      applicableCategories: c.applicableCategories || [],
      active: c.active,
    });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kodu silmek istiyor musunuz?")) return;
    await deleteDoc(doc(db, "discountCodes", id));
    setCodes(codes.filter(c => c.id !== id));
  };

  const handleToggleActive = async (c: DiscountCode) => {
    await updateDoc(doc(db, "discountCodes", c.id), { active: !c.active });
    setCodes(codes.map(x => x.id === c.id ? { ...x, active: !c.active } : x));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">İndirim Kodları</h1>
          <p className="text-white/40 text-sm mt-1">Kupon kodları oluşturun ve kullanımı takip edin.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-light uppercase tracking-[0.2em] hover:bg-white/80 transition-colors"
        >
          <Plus size={14} /> Yeni Kod
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Tag, label: "Toplam Kod", value: codes.length },
          { icon: Users, label: "Toplam Kullanım", value: codes.reduce((s, c) => s + (c.usedCount || 0), 0) },
          { icon: TrendingDown, label: "Aktif Kod", value: codes.filter(c => c.active).length },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0a0a0a] border border-white/5 p-5 rounded">
            <stat.icon size={16} className="text-white/20 mb-3" />
            <p className="text-2xl font-mono font-light text-white">{stat.value}</p>
            <p className="text-[9px] uppercase tracking-widest text-white/25 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-widest text-white/50">{editId ? "Kodu Düzenle" : "Yeni Kod Oluştur"}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
              <X size={16} className="text-white/30 hover:text-white transition-colors" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Code */}
            <div className="col-span-2 md:col-span-1 space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Kod *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="VOITE20"
                  className="flex-1 bg-white/5 border border-white/10 rounded p-3 text-sm font-mono focus:border-white outline-none uppercase"
                />
                <button onClick={generateCode} className="px-3 py-2 border border-white/10 text-[10px] uppercase tracking-wider text-white/40 hover:text-white hover:border-white/30 transition-colors rounded">
                  Oluştur
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">İndirim Tipi *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "percentage" | "fixed" }))}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none appearance-none">
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (₺)</option>
              </select>
            </div>

            {/* Value */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">
                {form.type === "percentage" ? "İndirim Oranı (%)" : "İndirim Tutarı (₺)"} *
              </label>
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "percentage" ? "20" : "150"}
                min="0"
                max={form.type === "percentage" ? "100" : undefined}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none"
              />
            </div>

            {/* Min Order */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Min. Sepet Tutarı (₺)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                placeholder="0 = sınırsız"
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none"
              />
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Maksimum Kullanım *</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="100"
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none"
              />
            </div>

            {/* Active */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.active ? "bg-white" : "bg-white/10"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-all ${form.active ? "left-5" : "left-0.5"}`} />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {form.active ? "Aktif" : "Pasif"}
                </span>
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-1">
                Geçerli Kategoriler
              </label>
              <p className="text-[9px] text-white/20 font-light">
                ⚠ Drop ürünlerinde hiçbir zaman geçerli olmaz. Boş bırakırsanız tüm non-drop kategorilerde geçerlidir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] border transition-colors rounded ${
                    form.applicableCategories.includes(cat.value)
                      ? "bg-white text-black border-white"
                      : "border-white/10 text-white/40 hover:border-white/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
              <div className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] border border-red-500/20 text-red-400/50 rounded cursor-not-allowed">
                Drop ✗
              </div>
            </div>
            {form.applicableCategories.length === 0 && (
              <p className="text-[9px] text-white/20">Hiç seçilmezse → tüm kategoriler geçerli (drop hariç)</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-white/30 hover:text-white text-xs uppercase tracking-widest transition-colors">
              İptal
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-6 py-2 bg-white text-black text-xs uppercase tracking-widest hover:bg-white/80 transition-colors flex items-center gap-2">
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {editId ? "Güncelle" : "Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* Codes List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-white/20" size={28} /></div>
      ) : codes.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-white/5 p-16 text-center rounded">
          <Tag size={32} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/20 text-sm uppercase tracking-widest">Henüz kod oluşturulmadı</p>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Kod", "Tip / Değer", "Min. Sipariş", "Kullanım", "Kategoriler", "Durum", ""].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[9px] uppercase tracking-widest text-white/20 font-light">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map(code => {
                const pct = code.maxUses > 0 ? Math.round((code.usedCount / code.maxUses) * 100) : 0;
                return (
                  <tr key={code.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-sm tracking-wider text-white">{code.code}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white/70">
                        {code.type === "percentage" ? `%${code.value}` : `₺${code.value}`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-white/40 font-mono">
                      {code.minOrderAmount > 0 ? `₺${code.minOrderAmount}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-white/70">{code.usedCount} / {code.maxUses}</span>
                          {code.usedCount >= code.maxUses && (
                            <span className="text-[8px] uppercase tracking-widest text-red-400">Doldu</span>
                          )}
                        </div>
                        <div className="w-24 h-1 bg-white/5 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${pct >= 100 ? "bg-red-500/50" : pct >= 70 ? "bg-yellow-500/50" : "bg-white/30"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(code.applicableCategories?.length > 0
                          ? code.applicableCategories
                          : ["Tümü"]
                        ).map(cat => (
                          <span key={cat} className="text-[8px] uppercase tracking-widest text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => handleToggleActive(code)}
                        className={`text-[9px] uppercase tracking-widest px-3 py-1.5 rounded border transition-colors ${
                          code.active ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-white/10 text-white/25 hover:border-white/30"
                        }`}>
                        {code.active ? "Aktif" : "Pasif"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEdit(code)} className="p-1.5 text-white/25 hover:text-white transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(code.id)} className="p-1.5 text-white/25 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
