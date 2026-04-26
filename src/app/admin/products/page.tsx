"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Loader2, Edit2, ImagePlus, Bold, Italic, List } from "lucide-react";
import Image from "next/image";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// sizeStock: { S: 10, M: 5, L: 20, XL: 0 }
interface Product {
  id: string;
  name: string;
  category: string;        // product type: hoodie, t-shirt etc
  seriesSlug?: string;     // e.g. "silent-series"
  dropNumber?: number;     // e.g. 1
  price: string;
  stock: number;
  sizeStock?: Record<string, number>;
  sizes: string[];
  description: string;
  image: string;
  images?: string[];
}

const PRODUCT_CATEGORIES = [
  { label: "Hoodie", value: "hoodie" },
  { label: "Sweatshirt", value: "sweatshirt" },
  { label: "T-Shirt", value: "t-shirt" },
  { label: "Pantolon", value: "pantolon" },
  { label: "Aksesuar", value: "aksesuar" },
];

const SERIES_OPTIONS = [
  { label: "Silent Series", slug: "silent-series" },
  { label: "Void Series", slug: "void-series" },
];

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY_FORM = {
  name: "",
  category: "hoodie",
  seriesSlug: "",
  dropNumber: "",
  price: "",
  sizes: "S,M,L,XL",
  sizeStock: {} as Record<string, number>,
  description: "",
  image: "",
  images: [] as string[],
};

/** Get total stock across all sizes */
function totalStock(p: Product): number {
  if (p.sizeStock && Object.keys(p.sizeStock).length > 0) {
    return Object.values(p.sizeStock).reduce((a, b) => a + b, 0);
  }
  return p.stock || 0;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState("");

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const qs = await getDocs(collection(db, "products"));
      const data: Product[] = [];
      qs.forEach(d => data.push({ id: d.id, ...d.data() } as Product));
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts(p => p.filter(x => x.id !== id));
  };

  // Build sizeStock from the sizes list, preserving existing values
  const buildSizeStock = (sizesStr: string, existing: Record<string, number> = {}) => {
    const sizes = sizesStr.split(",").map(s => s.trim()).filter(Boolean);
    const result: Record<string, number> = {};
    for (const s of sizes) {
      result[s] = existing[s] ?? 0;
    }
    return result;
  };

  const handleSizesChange = (sizesStr: string) => {
    const newSizeStock = buildSizeStock(sizesStr, formData.sizeStock);
    setFormData(f => ({ ...f, sizes: sizesStr, sizeStock: newSizeStock }));
  };

  const handleSizeStockChange = (size: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setFormData(f => ({ ...f, sizeStock: { ...f.sizeStock, [size]: num } }));
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const sizes = formData.sizes.split(",").map(s => s.trim()).filter(Boolean);
      const sizeStock = formData.sizeStock;
      const totalStk = Object.values(sizeStock).reduce((a, b) => a + b, 0);

      const productData = {
        name: formData.name,
        category: formData.category,
        seriesSlug: formData.seriesSlug || null,
        dropNumber: formData.dropNumber ? parseInt(formData.dropNumber) : null,
        price: formData.price,
        sizes,
        sizeStock,
        stock: totalStk,
        description: formData.description,
        image: formData.images[0] || formData.image || "/images/hoodie.png",
        images: formData.images.length > 0 ? formData.images : [formData.image || "/images/hoodie.png"],
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setProducts(p => p.map(x => x.id === editingId ? { ...x, ...productData } as Product : x));
      } else {
        const ref = await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
        setProducts(p => [...p, { id: ref.id, ...productData } as Product]);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("Ürün kaydedilirken hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    const imgs = product.images || (product.image ? [product.image] : []);
    const sizes = product.sizes || [];
    // Build sizeStock: use existing sizeStock, fallback to equal distribution
    let sizeStock: Record<string, number> = {};
    if (product.sizeStock && Object.keys(product.sizeStock).length > 0) {
      sizeStock = { ...product.sizeStock };
    } else {
      // Migrate from flat stock
      for (const s of sizes) { sizeStock[s] = 0; }
    }
    setFormData({
      name: product.name,
      category: product.category || "hoodie",
      seriesSlug: product.seriesSlug || "",
      dropNumber: product.dropNumber ? String(product.dropNumber) : "",
      price: product.price,
      sizes: sizes.join(", "),
      sizeStock,
      description: product.description || "",
      image: product.image || "",
      images: imgs,
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setImageInput("");
  };

  const handleAddImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    const imgs = [...formData.images, url];
    setFormData(f => ({ ...f, images: imgs, image: imgs[0] }));
    setImageInput("");
  };

  const handleRemoveImage = (idx: number) => {
    const imgs = formData.images.filter((_, i) => i !== idx);
    setFormData(f => ({ ...f, images: imgs, image: imgs[0] || "" }));
  };

  // Rich text helpers
  const descRef = useRef<HTMLTextAreaElement>(null);
  const insertText = (before: string, after = "") => {
    const el = descRef.current;
    if (!el) return;
    const s = el.selectionStart, e2 = el.selectionEnd;
    const selected = el.value.substring(s, e2);
    const newText = el.value.substring(0, s) + before + selected + after + el.value.substring(e2);
    setFormData(f => ({ ...f, description: newText }));
    setTimeout(() => { el.focus(); el.selectionStart = s + before.length; el.selectionEnd = s + before.length + selected.length; }, 10);
  };

  const getStatusBadge = (total: number) => {
    if (total === 0) return { label: "Tükendi", color: "bg-red-500/20 text-red-500" };
    if (total < 10) return { label: "Azalıyor", color: "bg-yellow-500/20 text-yellow-500" };
    return { label: "Aktif", color: "bg-green-500/20 text-green-500" };
  };

  const currentSizes = formData.sizes.split(",").map(s => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Ürünler</h1>
          <p className="text-white/50 text-sm mt-1">Koleksiyonları ve stok durumlarını yönetin.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(EMPTY_FORM); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[10px] font-light uppercase tracking-[0.2em] rounded hover:bg-white/80 transition-colors"
        >
          <Plus size={16} /> Yeni Ürün Ekle
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-[#030303] border border-white/5 rounded overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-white/30" size={32} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-xs border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Ürün</th>
                  <th className="px-6 py-4 font-bold">Kategori</th>
                  <th className="px-6 py-4 font-bold">Fiyat</th>
                  <th className="px-6 py-4 font-bold">Stok (Beden Bazlı)</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-white/50">Henüz hiç ürün eklenmedi.</td></tr>
                ) : products.map(product => {
                  const total = totalStock(product);
                  const badge = getStatusBadge(total);
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10 bg-black rounded border border-white/10 overflow-hidden flex-shrink-0">
                            <Image src={product.image || "/images/hoodie.png"} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-bold">{product.name}</p>
                            <p className="text-xs font-mono text-white/40">{product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/70">{product.category}</td>
                      <td className="px-6 py-4 font-mono font-bold">₺{product.price}</td>
                      <td className="px-6 py-4">
                        {product.sizeStock && Object.keys(product.sizeStock).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(product.sizeStock).map(([size, qty]) => (
                              <span key={size} className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${qty === 0 ? 'border-red-500/30 text-red-400' : 'border-white/10 text-white/70'}`}>
                                {size}:{qty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-mono text-white/50">{total} adet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-white/50 hover:text-white transition-colors" onClick={() => handleEditClick(product)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="p-2 text-white/50 hover:text-red-500 transition-colors" onClick={() => handleDelete(product.id)}>
                            <Trash2 size={16} />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded w-full max-w-3xl max-h-[92vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
              <h2 className="text-xl font-bold uppercase tracking-widest heading-style">
                {editingId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h2>
              <button onClick={handleCloseModal} className="text-white/50 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-8">

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ürün Adı *</label>
                  <input required type="text" value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors" />
                </div>

                {/* Product Category (type) */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ürün Tipi *</label>
                  <select value={formData.category} onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none appearance-none transition-colors">
                    {PRODUCT_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Series */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Seri</label>
                  <select value={formData.seriesSlug} onChange={e => setFormData(f => ({ ...f, seriesSlug: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none appearance-none transition-colors">
                    <option value="">Seri yok / Bağımsız</option>
                    {SERIES_OPTIONS.map(s => (
                      <option key={s.slug} value={s.slug}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Drop Number */}
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Drop No</label>
                  <input type="number" min="1" value={formData.dropNumber}
                    onChange={e => setFormData(f => ({ ...f, dropNumber: e.target.value }))}
                    placeholder="1"
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors" />
                </div>

                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Fiyat (₺) *</label>
                  <input required type="number" value={formData.price}
                    onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors" />
                </div>
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Bedenler (Virgülle)</label>
                  <input type="text" value={formData.sizes}
                    onChange={e => handleSizesChange(e.target.value)}
                    placeholder="S, M, L, XL, XXL"
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors" />
                  <p className="text-[10px] text-white/30">Beden yazınca aşağıda stok alanları otomatik açılır</p>
                </div>
              </div>

              {/* Per-Size Stock */}
              {currentSizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                      Beden Bazlı Stok
                    </label>
                    <span className="text-[10px] text-white/30 font-mono">
                      Toplam: {Object.values(formData.sizeStock).reduce((a, b) => a + b, 0)} adet
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {currentSizes.map(size => (
                      <div key={size} className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.15em] text-white/60 text-center block font-bold">
                          {size}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sizeStock[size] ?? 0}
                          onChange={e => handleSizeStockChange(size, e.target.value)}
                          className={`w-full bg-white/5 border rounded p-2 text-sm text-center font-mono focus:border-white outline-none transition-colors ${
                            (formData.sizeStock[size] ?? 0) === 0 ? 'border-red-500/30 text-red-400' : 'border-white/10 text-white'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30">Kırmızı = tükendi. 0 olan bedenler sitede "Tükendi" olarak gösterilir.</p>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ürün Açıklaması</label>
                <div className="border border-white/10 rounded overflow-hidden">
                  <div className="flex items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10">
                    <button type="button" onClick={() => insertText("**", "**")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="Kalın"><Bold size={14} /></button>
                    <button type="button" onClick={() => insertText("_", "_")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="İtalik"><Italic size={14} /></button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button type="button" onClick={() => insertText("\n• ")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="Madde"><List size={14} /></button>
                    <span className="ml-auto text-[10px] text-white/20 uppercase tracking-widest">Editör</span>
                  </div>
                  <textarea ref={descRef} rows={5} value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Ürün açıklaması...&#10;• Materyal: %100 Pamuk&#10;• Oversize Fit"
                    className="w-full bg-[#050505] p-4 text-sm text-white/80 outline-none resize-none leading-relaxed font-light" />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Ürün Görselleri ({formData.images.length})
                </label>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square bg-black border border-white/10 rounded overflow-hidden">
                        <Image src={img} alt={`Görsel ${idx + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="p-1 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                        {idx === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-white text-black px-1 rounded font-bold uppercase">Ana</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" value={imageInput} onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
                    placeholder="Görsel URL'si... (https://...)"
                    className="flex-1 bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors" />
                  <button type="button" onClick={handleAddImage} disabled={!imageInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white text-xs uppercase tracking-widest rounded hover:bg-white hover:text-black transition-colors disabled:opacity-30">
                    <ImagePlus size={16} /> Ekle
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 uppercase tracking-[0.2em] text-[10px] text-white/50 hover:text-white transition-colors">İptal</button>
                <button type="submit" disabled={uploading} className="px-6 py-3 bg-white text-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/80 transition-colors flex items-center gap-2">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {uploading ? "Kaydediliyor..." : (editingId ? "Güncelle" : "Ürünü Ekle")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
