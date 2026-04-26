import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
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
    // Iyzico also sends conversationId in the callback POST body
    const callbackConversationId = (formData.get("conversationId") as string || "").trim();

    console.log("=== CALLBACK START ===");
    console.log("token:", token?.substring(0, 30));
    console.log("conversationId from callback body:", callbackConversationId);

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // Verify payment with Iyzico
    const requestBody = {
      locale: "tr",
      conversationId: token.substring(0, 20),
      token,
    };

    const { authorization, randomString } = buildAuth(requestBody, API_PATH);

    const iyzicoRes = await fetch(
      `${IYZICO_BASE_URL}${API_PATH}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'x-iyzi-rnd': randomString,
          'x-iyzi-client-version': 'iyzipay-node-2.0.67',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await iyzicoRes.json();
    console.log("Iyzico verify — status:", result.status, "paymentStatus:", result.paymentStatus);

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.log("Payment not successful:", JSON.stringify(result));
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // --- Find Firestore order ---
    // Strategy 1: conversationId from callback body (= Firestore doc ID set during checkout init)
    // Strategy 2: Look up by iyzicoToken field we saved in checkout/route.ts
    // Strategy 3: callbackConversationId might already be the doc ID

    let firestoreDocId: string | null = null;

    // Try strategy 1: callbackConversationId is the Firestore doc ID
    if (callbackConversationId && callbackConversationId.length > 10) {
      firestoreDocId = callbackConversationId;
      console.log("Using conversationId from callback body:", firestoreDocId);
    }

    // Try strategy 2: look up by iyzicoToken
    if (!firestoreDocId) {
      try {
        const q = query(collection(db, "orders"), where("iyzicoToken", "==", token));
        const snap = await getDocs(q);
        if (!snap.empty) {
          firestoreDocId = snap.docs[0].id;
          console.log("Found order by iyzicoToken:", firestoreDocId);
        }
      } catch (e) {
        console.error("Token lookup error:", e);
      }
    }

    if (!firestoreDocId) {
      console.error("Could not find Firestore order for token:", token.substring(0, 20));
      // Still redirect to success — payment went through, we just couldn't update status
      return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });
    }

    // Update Firestore order
    try {
      await updateDoc(doc(db, "orders", firestoreDocId), {
        status: "Ödendi",
        paymentStatus: "Success",
        paymentId: String(result.paymentId || ""),
        updatedAt: new Date()
      });
      console.log("✅ Firestore updated for order:", firestoreDocId);
    } catch (dbError) {
      console.error("Firestore update error:", dbError);
    }

    // Send admin notification email
    if (resend && ADMIN_EMAIL) {
      try {
        await resend.emails.send({
          from: 'VOITÉ. <onboarding@resend.dev>',
          to: ADMIN_EMAIL,
          subject: `✅ Ödeme Alındı — ${firestoreDocId}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;">
              <h2>Ödeme Başarıyla Alındı</h2>
              <p><strong>Sipariş:</strong> ${firestoreDocId}</p>
              <p><strong>Ödeme ID:</strong> ${result.paymentId}</p>
              <a href="${SITE_URL}/admin/orders" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;margin-top:16px;">Admin Paneli</a>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
    }

    return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
  }
}
