import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';
import { Resend } from 'resend';

const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app').trim();

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

/** Parse Iyzico callback body — supports both multipart/form-data and application/x-www-form-urlencoded */
async function parseCallbackBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get('content-type') || '';
  const result: Record<string, string> = {};

  try {
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { result[k] = v; });
    } else {
      // multipart/form-data or unknown — try formData()
      const fd = await req.formData();
      fd.forEach((v, k) => { result[k] = String(v); });
    }
  } catch (e) {
    // Last resort: try raw text parse
    try {
      const text = await req.text();
      new URLSearchParams(text).forEach((v, k) => { result[k] = v; });
    } catch { /* ignore */ }
  }

  return result;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseCallbackBody(req);
    const token = (body['token'] || '').trim();
    const callbackConversationId = (body['conversationId'] || '').trim();

    console.log("=== IYZICO CALLBACK ===");
    console.log("body keys:", Object.keys(body));
    console.log("token prefix:", token.substring(0, 25));
    console.log("conversationId:", callbackConversationId);

    if (!token) {
      console.error("No token in callback body");
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // Verify payment with Iyzico API
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
    console.log("Iyzico verify — status:", result.status, "| paymentStatus:", result.paymentStatus, "| paymentId:", result.paymentId);

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.log("Payment NOT successful. Redirecting to error.");
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // ===== FIND PENDING CHECKOUT =====
    // S1: callbackConversationId is the pendingCheckouts doc ID (set as conversationId in checkout init)
    // S2: look up by iyzicoToken field
    let pendingDocId: string | null = null;
    let pendingData: any = null;

    // S1: direct doc lookup
    if (callbackConversationId && callbackConversationId.length > 5) {
      try {
        const snap = await getDoc(doc(db, "pendingCheckouts", callbackConversationId));
        if (snap.exists()) {
          pendingDocId = callbackConversationId;
          pendingData = snap.data();
          console.log("S1 ✅ Found pendingCheckout by conversationId:", pendingDocId);
        } else {
          console.log("S1 ❌ No doc at pendingCheckouts/" + callbackConversationId);
        }
      } catch (e) { console.error("S1 error:", e); }
    }

    // S2: query by iyzicoToken
    if (!pendingDocId) {
      try {
        const q = query(collection(db, "pendingCheckouts"), where("iyzicoToken", "==", token));
        const snap = await getDocs(q);
        if (!snap.empty) {
          pendingDocId = snap.docs[0].id;
          pendingData = snap.docs[0].data();
          console.log("S2 ✅ Found pendingCheckout by iyzicoToken:", pendingDocId);
        } else {
          console.log("S2 ❌ No pendingCheckout with iyzicoToken");
        }
      } catch (e) { console.error("S2 error:", e); }
    }

    if (!pendingData) {
      // S3: basketId is now the Firestore pendingCheckout doc ID (orderRef.id)
      const basketId = (result.basketId || '').trim();
      console.log("S3: trying basketId (Firestore doc ID) lookup:", basketId);
      if (basketId && basketId.length > 5) {
        try {
          const snap = await getDoc(doc(db, "pendingCheckouts", basketId));
          if (snap.exists()) {
            pendingDocId = basketId;
            pendingData = snap.data();
            console.log("S3 ✅ Found pendingCheckout by basketId:", pendingDocId);
          }
        } catch (e) { console.error("S3 error:", e); }
      }
    }

    if (!pendingData) {
      console.error("❌ Could not find pendingCheckout. Creating emergency order.");
      const emergencyId = callbackConversationId || `callback-${Date.now()}`;
      const emergencyOrderId = "VOI-" + Math.floor(100000 + Math.random() * 900000);
      try {
        await setDoc(doc(db, "orders", emergencyId), {
          orderId: emergencyOrderId,
          status: "Ödendi",
          paymentStatus: "Success",
          paymentId: String(result.paymentId || ""),
          total: result.paidPrice || result.price || 0,
          customerName: "-", customerEmail: "-", items: [],
          paidAt: new Date(),
          note: "Emergency order — pendingCheckout not found",
        });
        console.log("Emergency order created:", emergencyOrderId);
      } catch (e) { console.error("Emergency order error:", e); }
      return NextResponse.redirect(`${SITE_URL}/checkout/success?kod=${encodeURIComponent(emergencyOrderId)}`, { status: 303 });
    }

    // ===== CREATE CONFIRMED ORDER =====
    let confirmedOrderId = "";
    try {
      // Generate VOI- code HERE — only after payment confirmed
      confirmedOrderId = "VOI-" + Math.floor(100000 + Math.random() * 900000);

      await setDoc(doc(db, "orders", pendingDocId!), {
        ...pendingData,
        orderId: confirmedOrderId,
        status: "Ödendi",
        paymentStatus: "Success",
        paymentId: String(result.paymentId || ""),
        paidAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Order created:", confirmedOrderId, "| doc:", pendingDocId);

      // Clean up pendingCheckout
      try {
        await deleteDoc(doc(db, "pendingCheckouts", pendingDocId!));
        console.log("🗑️ Deleted pendingCheckout:", pendingDocId);
      } catch (e) { console.error("Cleanup error:", e); }

      // Mark coupon as used (if one was applied)
      if (pendingData.couponId && pendingData.customerEmail) {
        try {
          await updateDoc(doc(db, "discountCodes", pendingData.couponId), {
            usedCount: increment(1),
            usedBy: arrayUnion(pendingData.customerEmail.toLowerCase()),
          });
          console.log("✅ Coupon marked as used:", pendingData.couponId);
        } catch (e) { console.error("Coupon update error:", e); }
      }

      // Admin email
      if (resend && ADMIN_EMAIL) {
        try {
          await resend.emails.send({
            from: 'VOITÉ. <onboarding@resend.dev>',
            to: ADMIN_EMAIL,
            subject: `✅ Ödeme Alındı — ${confirmedOrderId}`,
            html: `<h2>✅ Ödeme Alındı</h2>
              <p><b>Sipariş:</b> ${confirmedOrderId}</p>
              <p><b>Müşteri:</b> ${pendingData.customerName} (${pendingData.customerEmail})</p>
              <p><b>Tutar:</b> ₺${pendingData.total}${pendingData.discountAmount ? ` (${pendingData.discountAmount}₺ indirim uygulandı)` : ""}</p>
              <a href="${SITE_URL}/admin/orders" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;margin-top:12px;">Admin Paneli</a>`,
          });
        } catch (e) { console.error("Email error:", e); }
      }

    } catch (dbError) {
      console.error("Order creation error:", dbError);
    }


    return NextResponse.redirect(`${SITE_URL}/checkout/success?kod=${encodeURIComponent(confirmedOrderId)}`, { status: 303 });


  } catch (error) {
    console.error("Callback fatal error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
  }
}
