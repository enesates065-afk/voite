"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SERIES_SLUGS: Record<string, string> = {
  "Silent Series": "silent-series",
  "Void Series": "void-series",
};

interface Series {
  id: string;
  name: string;
  slug: string;
  description: string;
  active: boolean;
}

interface Drop {
  id: string;
  seriesId: string;
  seriesSlug: string;
  seriesName: string;
  dropNumber: number;
  description: string;
  active: boolean;
  archived: boolean;
}

export default function AdminDropsPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Series form
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [seriesForm, setSeriesForm] = useState({ name: "", description: "" });
  const [editSeriesId, setEditSeriesId] = useState<string | null>(null);

  // Drop form
  const [dropForm, setDropForm] = useState({ seriesId: "", dropNumber: "", description: "" });
  const [showDropForm, setShowDropForm] = useState<string | null>(null); // seriesId

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const sSnap = await getDocs(collection(db, "series"));
      const s: Series[] = sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Series));
      setSeriesList(s);

      const dSnap = await getDocs(collection(db, "drops"));
      const d: Drop[] = dSnap.docs.map(dd => ({ id: dd.id, ...dd.data() } as Drop));
      setDrops(d.sort((a, b) => a.dropNumber - b.dropNumber));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveSeries = async () => {
    if (!seriesForm.name.trim()) return;
    const slug = SERIES_SLUGS[seriesForm.name] || seriesForm.name.toLowerCase().replace(/\s+/g, "-");
    try {
      if (editSeriesId) {
        await updateDoc(doc(db, "series", editSeriesId), { ...seriesForm, slug });
        setSeriesList(seriesList.map(s => s.id === editSeriesId ? { ...s, ...seriesForm, slug } : s));
      } else {
        const ref = await addDoc(collection(db, "series"), { ...seriesForm, slug, active: true, createdAt: new Date() });
        setSeriesList([...seriesList, { id: ref.id, ...seriesForm, slug, active: true }]);
      }
      setSeriesForm({ name: "", description: "" });
      setEditSeriesId(null);
      setShowSeriesForm(false);
    } catch (e) { console.error(e); }
  };

  const handleDeleteSeries = async (id: string) => {
    if (!confirm("Bu seriyi silmek istediğinizden emin misiniz?")) return;
    await deleteDoc(doc(db, "series", id));
    setSeriesList(seriesList.filter(s => s.id !== id));
  };

  const handleSaveDrop = async (seriesId: string) => {
    const series = seriesList.find(s => s.id === seriesId);
    if (!series || !dropForm.dropNumber) return;
    try {
      const ref = await addDoc(collection(db, "drops"), {
        seriesId,
        seriesSlug: series.slug,
        seriesName: series.name,
        dropNumber: parseInt(dropForm.dropNumber),
        description: dropForm.description,
        active: true,
        archived: false,
        createdAt: new Date(),
      });
      setDrops([...drops, {
        id: ref.id, seriesId, seriesSlug: series.slug, seriesName: series.name,
        dropNumber: parseInt(dropForm.dropNumber), description: dropForm.description,
        active: true, archived: false,
      }]);
      setDropForm({ seriesId: "", dropNumber: "", description: "" });
      setShowDropForm(null);
    } catch (e) { console.error(e); }
  };

  const toggleDropArchive = async (dropId: string, current: boolean) => {
    await updateDoc(doc(db, "drops", dropId), { archived: !current, active: current });
    setDrops(drops.map(d => d.id === dropId ? { ...d, archived: !current, active: current } : d));
  };

  const toggleDropActive = async (dropId: string, current: boolean) => {
    await updateDoc(doc(db, "drops", dropId), { active: !current });
    setDrops(drops.map(d => d.id === dropId ? { ...d, active: !current } : d));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Seriler & Droplar</h1>
          <p className="text-white/50 text-sm mt-1">Koleksiyon yapısını yönetin.</p>
        </div>
        <button onClick={() => { setShowSeriesForm(true); setEditSeriesId(null); setSeriesForm({ name: "", description: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-light uppercase tracking-[0.2em] hover:bg-white/80 transition-colors">
          <Plus size={14} /> Yeni Seri
        </button>
      </div>

      {/* New Series Form */}
      {showSeriesForm && (
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded space-y-4">
          <h3 className="text-xs uppercase tracking-widest text-white/50">{editSeriesId ? "Seriyi Düzenle" : "Yeni Seri"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Seri Adı</label>
              <select value={seriesForm.name} onChange={e => setSeriesForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none">
                <option value="">Seç veya yaz...</option>
                <option value="Silent Series">Silent Series</option>
                <option value="Void Series">Void Series</option>
              </select>
              <input type="text" placeholder="veya özel isim..." value={seriesForm.name}
                onChange={e => setSeriesForm(f => ({ ...f, name: e.target.value }))}
                className="w-full mt-2 bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 block mb-2">Açıklama</label>
              <input type="text" value={seriesForm.description}
                onChange={e => setSeriesForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowSeriesForm(false)} className="px-4 py-2 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">İptal</button>
            <button onClick={handleSaveSeries} className="px-4 py-2 bg-white text-black text-xs uppercase tracking-widest hover:bg-white/80 transition-colors">Kaydet</button>
          </div>
        </div>
      )}

      {/* Series List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-white/20" size={28} /></div>
      ) : (
        <div className="space-y-3">
          {seriesList.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/5 p-12 text-center">
              <p className="text-white/20 text-sm uppercase tracking-widest">Henüz seri yok. Yukarıdan ekleyin.</p>
            </div>
          ) : seriesList.map(series => {
            const seriesDrops = drops.filter(d => d.seriesId === series.id);
            const isExpanded = expanded === series.id;
            return (
              <div key={series.id} className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden">
                {/* Series Header */}
                <div className="flex items-center justify-between p-6 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : series.id)}>
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                    <div>
                      <p className="font-bold uppercase tracking-widest heading-style">{series.name}</p>
                      <p className="text-white/30 text-xs">{series.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest">{seriesDrops.length} drop</span>
                    <button onClick={e => { e.stopPropagation(); setEditSeriesId(series.id); setSeriesForm({ name: series.name, description: series.description }); setShowSeriesForm(true); }}
                      className="p-2 text-white/30 hover:text-white transition-colors"><Edit2 size={14} /></button>
                    <button onClick={e => { e.stopPropagation(); handleDeleteSeries(series.id); }}
                      className="p-2 text-white/30 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Drops */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-6 space-y-3">
                    {seriesDrops.map(drop => (
                      <div key={drop.id} className="flex items-center justify-between bg-[#050505] border border-white/5 p-4 rounded">
                        <div>
                          <p className="font-mono font-bold text-sm">Drop {String(drop.dropNumber).padStart(2, "0")}</p>
                          <p className="text-white/30 text-xs">{drop.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggleDropActive(drop.id, drop.active)}
                            className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded border transition-colors ${drop.active ? "border-green-500/40 text-green-400" : "border-white/10 text-white/30"}`}>
                            {drop.active ? "Aktif" : "Pasif"}
                          </button>
                          <button onClick={() => toggleDropArchive(drop.id, drop.archived)}
                            className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded border transition-colors ${drop.archived ? "border-white/30 text-white/60" : "border-white/5 text-white/20"}`}>
                            {drop.archived ? "Arşivde" : "Arşivle"}
                          </button>
                          <button onClick={() => { setDrops(drops.filter(d => d.id !== drop.id)); deleteDoc(doc(db, "drops", drop.id)); }}
                            className="p-1.5 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}

                    {/* Add Drop */}
                    {showDropForm === series.id ? (
                      <div className="bg-[#050505] border border-white/10 p-4 rounded space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/30 block mb-1">Drop No</label>
                            <input type="number" placeholder="1" value={dropForm.dropNumber}
                              onChange={e => setDropForm(f => ({ ...f, dropNumber: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:border-white outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-white/30 block mb-1">Açıklama</label>
                            <input type="text" placeholder="Kısa açıklama..." value={dropForm.description}
                              onChange={e => setDropForm(f => ({ ...f, description: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm focus:border-white outline-none" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowDropForm(null)} className="text-white/30 hover:text-white text-xs uppercase tracking-widest transition-colors">İptal</button>
                          <button onClick={() => handleSaveDrop(series.id)} className="px-4 py-2 bg-white text-black text-xs uppercase tracking-widest hover:bg-white/80 transition-colors">Drop Ekle</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setShowDropForm(series.id); setDropForm({ seriesId: series.id, dropNumber: "", description: "" }); }}
                        className="w-full border border-dashed border-white/10 p-3 text-[10px] uppercase tracking-widest text-white/20 hover:text-white/50 hover:border-white/20 transition-colors">
                        + Drop Ekle
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
