import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';
import { Resend } from 'resend';

const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();

const API_PATH = '/payment/iyzipos/checkoutform/auth/ecom/detail';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function buildAuth(body: object, path: string): { authorization: string; randomString: string } {
  const randomString = `${process.hrtime()[0]}${Math.random().toString(8).slice(2)}`;
  const signature = crypto
    .createHmac('sha256', IYZICO_SECRET_KEY)
    .update(randomString + path + JSON.stringify(body))
    .digest('hex');
  const authParams = [
    `apiKey:${IYZICO_API_KEY}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join('&');
  return {
    authorization: `IYZWSv2 ${Buffer.from(authParams).toString('base64')}`,
    randomString,
  };
}

export async function POST(req: Request): Promise<Response> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app';

  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    const callbackConversationId = (formData.get("conversationId") as string || "").trim();

    console.log("=== CALLBACK ===");
    console.log("token:", token?.substring(0, 20));
    console.log("conversationId:", callbackConversationId);

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // Verify payment with Iyzico
    const requestBody = { locale: "tr", conversationId: token.substring(0, 20), token };
    const { authorization, randomString } = buildAuth(requestBody, API_PATH);

    const iyzicoRes = await fetch(`${IYZICO_BASE_URL}${API_PATH}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomString,
        'x-iyzi-client-version': 'iyzipay-node-2.0.67',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await iyzicoRes.json();
    console.log("Iyzico verify — status:", result.status, "paymentStatus:", result.paymentStatus);

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.log("Payment not successful:", JSON.stringify(result));
      // Payment failed — don't create order, just redirect to error
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // --- Payment SUCCESS: find the pendingCheckout and create real order ---
    // Strategy 1: callbackConversationId is the Firestore pendingCheckout doc ID
    // Strategy 2: look up by iyzicoToken field saved in checkout/route.ts

    let pendingDocId: string | null = null;
    let pendingData: any = null;

    // Try S1: direct doc ID
    if (callbackConversationId && callbackConversationId.length > 10) {
      try {
        const pendingRef = doc(db, "pendingCheckouts", callbackConversationId);
        const snap = await (await import("firebase/firestore")).getDoc(pendingRef);
        if (snap.exists()) {
          pendingDocId = callbackConversationId;
          pendingData = snap.data();
          console.log("Found pendingCheckout by conversationId:", pendingDocId);
        }
      } catch (e) { console.error("S1 lookup error:", e); }
    }

    // Try S2: iyzicoToken field
    if (!pendingDocId) {
      try {
        const q = query(collection(db, "pendingCheckouts"), where("iyzicoToken", "==", token));
        const snap = await getDocs(q);
        if (!snap.empty) {
          pendingDocId = snap.docs[0].id;
          pendingData = snap.docs[0].data();
          console.log("Found pendingCheckout by iyzicoToken:", pendingDocId);
        }
      } catch (e) { console.error("S2 lookup error:", e); }
    }

    if (!pendingData) {
      console.error("pendingCheckout not found for token:", token.substring(0, 20));
      // Still redirect to success — payment went through
      return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });
    }

    // Create confirmed order in `orders` collection
    try {
      // Use the same orderId from pendingCheckout
      const orderId = pendingData.orderId || `VOI-${Date.now()}`;
      
      await setDoc(doc(db, "orders", pendingDocId!), {
        ...pendingData,
        status: "Ödendi",
        paymentStatus: "Success",
        paymentId: String(result.paymentId || ""),
        paidAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Order created in orders collection:", pendingDocId);

      // Delete from pendingCheckouts (cleanup)
      try {
        await deleteDoc(doc(db, "pendingCheckouts", pendingDocId!));
        console.log("🗑️ Removed from pendingCheckouts:", pendingDocId);
      } catch (e) { console.error("Cleanup error:", e); }

      // Admin notification email
      if (resend && ADMIN_EMAIL) {
        try {
          await resend.emails.send({
            from: 'VOITÉ. <onboarding@resend.dev>',
            to: ADMIN_EMAIL,
            subject: `✅ Ödeme Alındı — ${orderId}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:500px;">
                <h2>✅ Ödeme Başarıyla Alındı</h2>
                <p><strong>Sipariş No:</strong> ${orderId}</p>
                <p><strong>Müşteri:</strong> ${pendingData.customerName} (${pendingData.customerEmail})</p>
                <p><strong>Tutar:</strong> ₺${pendingData.total}</p>
                <p><strong>Ödeme ID:</strong> ${result.paymentId}</p>
                <a href="${SITE_URL}/admin/orders" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;margin-top:16px;">Admin Paneli</a>
              </div>
            `,
          });
        } catch (emailErr) { console.error("Email error:", emailErr); }
      }

    } catch (dbError) {
      console.error("Order creation error:", dbError);
    }

    return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
  }
}
