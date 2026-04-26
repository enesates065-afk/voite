"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2, Edit2 } from "lucide-react";
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
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    category: "Drop 01",
    price: "",
    stock: "0",
    sizes: "S,M,L,XL",
    description: "",
    image: "",
  });

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

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const productData = {
        name: formData.name,
        category: formData.category,
        price: formData.price,
        stock: parseInt(formData.stock),
        sizes: formData.sizes.split(",").map(s => s.trim()),
        description: formData.description,
        image: formData.image || "/images/hoodie.png",
      };

      if (editingId) {
        // Update existing product
        await updateDoc(doc(db, "products", editingId), productData);
        setProducts(products.map(p => p.id === editingId ? { ...p, ...productData } as Product : p));
      } else {
        // Add new product
        const newProduct = { ...productData, createdAt: new Date() };
        const docRef = await addDoc(collection(db, "products"), newProduct);
        setProducts([...products, { id: docRef.id, ...newProduct } as Product]);
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
    setFormData({
      name: product.name,
      category: product.category || "Drop 01",
      price: product.price,
      stock: product.stock.toString(),
      sizes: product.sizes.join(", "),
      description: product.description || "",
      image: product.image || "",
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", category: "Drop 01", price: "", stock: "0", sizes: "S,M,L,XL", description: "", image: "" });
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
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", category: "Drop 01", price: "", stock: "0", sizes: "S,M,L,XL", description: "", image: "" });
            setIsModalOpen(true);
          }}
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
                  <th className="px-6 py-4 font-bold">Durum</th>
                  <th className="px-6 py-4 font-bold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-white/50">Henüz hiç ürün eklenmedi.</td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const status = getStatus(product.stock);
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
                        <td className="px-6 py-4 font-mono font-bold">${product.price}</td>
                        <td className="px-6 py-4 font-mono">{product.stock}</td>
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

      {/* Modal Ekleme */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-bold uppercase tracking-widest heading-style">{editingId ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}</h2>
              <button onClick={handleCloseModal} className="text-white/50 hover:text-white"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Ürün Adı</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none" />
                </div>
                
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-fener-gold outline-none appearance-none">
                    <option value="Drop 01">Drop 01</option>
                    <option value="Temel">Temel Parçalar</option>
                    <option value="Aksesuar">Aksesuar</option>
                    <option value="Arşiv">Arşiv</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold">Fiyat ($)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-fener-gold outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold">Stok Miktarı</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-fener-gold outline-none" />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold">Bedenler (Virgülle ayırın)</label>
                  <input type="text" value={formData.sizes} onChange={e => setFormData({...formData, sizes: e.target.value})} placeholder="S, M, L, XL" className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-fener-gold outline-none" />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-xs uppercase tracking-widest text-white/50 font-bold">Açıklama</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-fener-gold outline-none" />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">Ürün Görseli (URL veya dosya yolu)</label>
                  <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="/images/hoodie.png" className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm focus:border-white outline-none" />
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 uppercase tracking-[0.2em] text-[10px] font-light text-white/50 hover:text-white transition-colors">İptal</button>
                <button type="submit" disabled={uploading} className="px-6 py-3 bg-white text-black uppercase tracking-[0.2em] text-[10px] font-light hover:bg-white/80 transition-colors flex items-center gap-2">
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {uploading ? 'Kaydediliyor...' : (editingId ? 'Güncelle' : 'Ürünü Ekle')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
