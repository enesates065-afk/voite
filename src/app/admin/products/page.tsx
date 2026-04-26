"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Loader2, Edit2, ImagePlus, GripVertical, Bold, Italic, List } from "lucide-react";
import Image from "next/image";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  sizes: string[];
  description: string;
  image: string;
  images?: string[];
}

const EMPTY_FORM = {
  name: "",
  category: "Drop 01",
  price: "",
  stock: "0",
  sizes: "S,M,L,XL",
  description: "",
  image: "",
  images: [] as string[],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageInput, setImageInput] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const data: Product[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleAddImage = () => {
    const url = imageInput.trim();
    if (!url) return;
    const newImages = [...formData.images, url];
    setFormData({ ...formData, images: newImages, image: newImages[0] });
    setImageInput("");
  };

  const handleRemoveImage = (idx: number) => {
    const newImages = formData.images.filter((_, i) => i !== idx);
    setFormData({ ...formData, images: newImages, image: newImages[0] || "" });
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        stock: parseInt(formData.stock),
        sizes: formData.sizes.split(",").map(s => s.trim()).filter(Boolean),
        description: formData.description,
        image: formData.images[0] || formData.image || "/images/hoodie.png",
        images: formData.images.length > 0 ? formData.images : [formData.image || "/images/hoodie.png"],
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setProducts(products.map(p => p.id === editingId ? { ...p, ...productData } as Product : p));
      } else {
        const docRef = await addDoc(collection(db, "products"), { ...productData, createdAt: new Date() });
        setProducts([...products, { id: docRef.id, ...productData } as Product]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Ürün kaydedilirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    const imgs = product.images || (product.image ? [product.image] : []);
    setFormData({
      name: product.name,
      category: product.category || "Drop 01",
      price: product.price,
      stock: product.stock.toString(),
      sizes: product.sizes.join(", "),
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

  // Simple rich text helpers for textarea
  const descRef = useRef<HTMLTextAreaElement>(null);
  const insertText = (before: string, after = "") => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    const newText = el.value.substring(0, start) + before + selected + after + el.value.substring(end);
    setFormData({ ...formData, description: newText });
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + before.length;
      el.selectionEnd = start + before.length + selected.length;
    }, 10);
  };

  const getStatus = (stock: number) => {
    if (stock === 0) return { label: "Tükendi", color: "bg-red-500/20 text-red-500" };
    if (stock < 10) return { label: "Azalıyor", color: "bg-yellow-500/20 text-yellow-500" };
    return { label: "Aktif", color: "bg-green-500/20 text-green-500" };
  };

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

      <div className="bg-[#030303] border border-white/5 rounded overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-white/30" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-xs border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Ürün</th>
                  <th className="px-6 py-4 font-bold">Kategori</th>
                  <th className="px-6 py-4 font-bold">Fiyat</th>
                  <th className="px-6 py-4 font-bold">Stok</th>
                  <th className="px-6 py-4 font-bold">Görseller</th>
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-white/50">Henüz hiç ürün eklenmedi.</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const status = getStatus(product.stock);
                    const imgCount = (product.images || [product.image]).filter(Boolean).length;
                    return (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10 bg-black rounded border border-white/10 overflow-hidden">
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
                        <td className="px-6 py-4 font-mono">{product.stock}</td>
                        <td className="px-6 py-4 text-white/50 text-xs font-mono">{imgCount} görsel</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm ${status.color}`}>
                            {status.label}
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
                  })
                )}
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
              <button onClick={handleCloseModal} className="text-white/50 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-6">

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ürün Adı *</label>
                  <input
                    required type="text" value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors"
                  />
                </div>

                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none appearance-none transition-colors"
                  >
                    <option value="Drop 01">Drop 01</option>
                    <option value="Temel">Temel Parçalar</option>
                    <option value="Aksesuar">Aksesuar</option>
                    <option value="Arşiv">Arşiv</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Fiyat (₺) *</label>
                  <input
                    required type="number" value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Stok Miktarı</label>
                  <input
                    required type="number" value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Bedenler (Virgülle ayırın)</label>
                  <input
                    type="text" value={formData.sizes}
                    onChange={e => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="S, M, L, XL, XXL"
                    className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Description Editor */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">Ürün Açıklaması</label>
                <div className="border border-white/10 rounded overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10">
                    <button type="button" onClick={() => insertText("**", "**")}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="Kalın">
                      <Bold size={14} />
                    </button>
                    <button type="button" onClick={() => insertText("_", "_")}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="İtalik">
                      <Italic size={14} />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button type="button" onClick={() => insertText("\n• ")}
                      className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors" title="Madde">
                      <List size={14} />
                    </button>
                    <span className="ml-auto text-[10px] text-white/20 uppercase tracking-widest">Açıklama Editörü</span>
                  </div>
                  <textarea
                    ref={descRef}
                    rows={6}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ürün açıklamasını buraya yazın...&#10;&#10;• Özellik 1&#10;• Özellik 2&#10;• Materyal: %100 Pamuk"
                    className="w-full bg-[#050505] p-4 text-sm text-white/80 outline-none resize-none leading-relaxed font-light"
                  />
                </div>
                <p className="text-[10px] text-white/30">İpucu: Madde için • kullanın, kalın için **metin** yazın</p>
              </div>

              {/* Multi Image Upload */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Ürün Görselleri ({formData.images.length} görsel)
                </label>

                {/* Image Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square bg-black border border-white/10 rounded overflow-hidden">
                        <Image src={img} alt={`Görsel ${idx + 1}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {idx === 0 && (
                          <span className="absolute bottom-1 left-1 text-[8px] bg-white text-black px-1 rounded font-bold uppercase">Ana</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Image URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={e => setImageInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddImage())}
                    placeholder="Görsel URL'si yapıştırın... (https://...)"
                    className="flex-1 bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!imageInput.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 text-white text-xs uppercase tracking-widest rounded hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ImagePlus size={16} /> Ekle
                  </button>
                </div>
                <p className="text-[10px] text-white/30">İlk eklenen görsel ana görsel olarak gösterilir. Enter ile hızlıca ekleyebilirsiniz.</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal}
                  className="px-6 py-3 uppercase tracking-[0.2em] text-[10px] font-light text-white/50 hover:text-white transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={uploading}
                  className="px-6 py-3 bg-white text-black uppercase tracking-[0.2em] text-[10px] font-light hover:bg-white/80 transition-colors flex items-center gap-2">
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
