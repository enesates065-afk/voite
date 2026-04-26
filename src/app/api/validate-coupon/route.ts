import { NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  slug?: string;
  // product fields to check category/drop
  category?: string;
  dropNumber?: number;
  seriesSlug?: string;
}

export async function POST(req: Request) {
  try {
    const { code, email, cartItems, cartTotal } = await req.json();

    if (!code || !email || !cartItems || cartTotal === undefined) {
      return NextResponse.json({ valid: false, error: "Eksik bilgi." }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // Find code in Firestore
    const q = query(collection(db, "discountCodes"), where("code", "==", upperCode));
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ valid: false, error: "Geçersiz kod." });
    }

    const codeDoc = snap.docs[0];
    const codeData = codeDoc.data();

    // Check active
    if (!codeData.active) {
      return NextResponse.json({ valid: false, error: "Bu kod artık aktif değil." });
    }

    // Check max uses
    if (codeData.usedCount >= codeData.maxUses) {
      return NextResponse.json({ valid: false, error: "Bu kodun kullanım limiti doldu." });
    }

    // Check if email already used it
    const usedBy: string[] = codeData.usedBy || [];
    if (usedBy.includes(email.toLowerCase())) {
      return NextResponse.json({ valid: false, error: "Bu kodu daha önce kullandınız." });
    }

    // Calculate eligible subtotal (non-drop items only, category filter)
    const applicableCategories: string[] = codeData.applicableCategories || [];

    // We need to fetch each cart item's product data to check category/dropNumber
    // For now, use cartItems data — slug is the Firestore product ID
    let eligibleTotal = 0;
    let ineligibleTotal = 0;

    for (const item of cartItems as CartItem[]) {
      // Fetch product to get category and dropNumber
      let itemCategory = item.category || "";
      let itemDropNumber = item.dropNumber ?? null;

      if (!itemCategory || itemDropNumber === undefined) {
        // fetch from firestore
        try {
          const productId = item.slug || item.id?.split("-")[0];
          if (productId) {
            const { getDoc, doc } = await import("firebase/firestore");
            const productSnap = await getDoc(doc(db, "products", productId));
            if (productSnap.exists()) {
              const pd = productSnap.data();
              itemCategory = pd.category || "";
              itemDropNumber = pd.dropNumber ?? null;
            }
          }
        } catch { /* use item data */ }
      }

      const isDropProduct = itemDropNumber !== null && itemDropNumber !== undefined && itemDropNumber > 0;

      // Drop products NEVER eligible
      if (isDropProduct) {
        ineligibleTotal += item.price * item.quantity;
        continue;
      }

      // Category check (if applicableCategories is set)
      if (applicableCategories.length > 0 && !applicableCategories.includes(itemCategory)) {
        ineligibleTotal += item.price * item.quantity;
        continue;
      }

      eligibleTotal += item.price * item.quantity;
    }

    // Check minimum order amount (based on total eligible)
    if (codeData.minOrderAmount > 0 && eligibleTotal < codeData.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Bu kod için geçerli ürün toplamı minimum ₺${codeData.minOrderAmount} olmalı. (Geçerli ürünler: ₺${eligibleTotal})`,
      });
    }

    if (eligibleTotal === 0) {
      return NextResponse.json({
        valid: false,
        error: "Sepetinizdeki ürünler bu kod için geçerli değil. (Drop ürünleri ve belirtilen kategoriler hariç tutulur.)",
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (codeData.type === "percentage") {
      discountAmount = Math.round((eligibleTotal * codeData.value) / 100);
    } else {
      discountAmount = Math.min(codeData.value, eligibleTotal);
    }

    const finalTotal = Math.max(0, cartTotal - discountAmount);

    return NextResponse.json({
      valid: true,
      codeId: codeDoc.id,
      code: upperCode,
      discountAmount,
      finalTotal,
      eligibleTotal,
      type: codeData.type,
      value: codeData.value,
      message: codeData.type === "percentage"
        ? `%${codeData.value} indirim uygulandı (₺${discountAmount})`
        : `₺${discountAmount} indirim uygulandı`,
    });

  } catch (err) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ valid: false, error: "Bir hata oluştu." }, { status: 500 });
  }
}
