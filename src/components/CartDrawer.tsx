"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import Link from "next/link";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getCartTotal } = useCartStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-voite-black border-l border-white/5 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-lg font-light uppercase tracking-[0.2em] heading-style flex items-center gap-3">
                <ShoppingBag size={18} className="text-white/50" />
                Sepetim ({items.length})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors p-2"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <ShoppingBag size={48} className="text-white/5" />
                  <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-light">Sepetiniz Boş</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="mt-4 border-b border-white/20 text-white/60 uppercase tracking-[0.2em] text-[10px] pb-1 hover:text-white hover:border-white transition-all duration-500"
                  >
                    Alışverişe Devam Et
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-[#0a0a0a] p-3 border border-white/5">
                    {/* Item Image */}
                    <div className="relative w-20 h-24 bg-black border border-white/5 flex-shrink-0">
                      <Image src={item.image} alt={item.name} fill className="object-cover opacity-80" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-tight heading-style">{item.name}</h3>
                          <p className="text-xs text-white/50 uppercase tracking-widest mt-1">Beden: {item.size}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-white/30 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="flex items-center border border-white/20">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-mono font-bold">₺{item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-8 border-t border-white/5 bg-[#030303]">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-xs uppercase tracking-[0.2em] text-white/50 font-light">Toplam</span>
                  <span className="text-xl font-light text-white">₺{getCartTotal()}</span>
                </div>
                <Link href="/checkout">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-5 bg-white text-black font-light uppercase tracking-[0.2em] text-xs hover:bg-white/80 transition-colors flex items-center justify-center gap-2"
                  >
                    Ödeme Adımına Geç
                  </button>
                </Link>
                <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.2em] mt-6">
                  Kargo ve vergiler ödeme adımında hesaplanır.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
