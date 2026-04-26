import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
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
    // Iyzico sends the ORIGINAL conversationId (= Firestore order doc ID) in the callback POST body
    const firestoreOrderId = formData.get("conversationId") as string;

    console.log("=== CALLBACK ===");
    console.log("token:", token?.substring(0, 20));
    console.log("conversationId from Iyzico:", firestoreOrderId);

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // Verify payment with Iyzico
    const requestBody = {
      locale: "tr",
      conversationId: firestoreOrderId || token.substring(0, 20),
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
    console.log("Iyzico verify result status:", result.status, "paymentStatus:", result.paymentStatus);

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.log("Payment failed or not successful:", JSON.stringify(result));
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // Update Firestore order — use conversationId from Iyzico's callback POST body
    // This is the Firestore doc ID we set during checkout initialization
    const orderId = firestoreOrderId || result.conversationId;
    console.log("Updating Firestore order:", orderId);

    if (orderId && orderId.length > 5) {
      try {
        await updateDoc(doc(db, "orders", orderId), {
          status: "Ödendi",
          paymentStatus: "Success",
          paymentId: String(result.paymentId || ""),
          updatedAt: new Date()
        });
        console.log("Firestore updated successfully for order:", orderId);

        // Send confirmation email via Resend
        if (resend && ADMIN_EMAIL) {
          try {
            await resend.emails.send({
              from: 'onboarding@resend.dev',
              to: ADMIN_EMAIL,
              subject: `✅ Yeni Ödeme Alındı — ${orderId}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;">
                  <h2 style="color:#000;">Ödeme Başarıyla Alındı</h2>
                  <p><strong>Sipariş ID:</strong> ${orderId}</p>
                  <p><strong>Ödeme ID:</strong> ${result.paymentId}</p>
                  <p><strong>Tutar:</strong> ₺${result.price || result.paidPrice || ""}</p>
                  <p>Admin panelinden siparişi görüntüleyebilirsiniz.</p>
                  <a href="${SITE_URL}/admin/orders" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;margin-top:16px;">Admin Panelini Aç</a>
                </div>
              `,
            });
            console.log("Admin email sent to:", ADMIN_EMAIL);
          } catch (emailErr) {
            console.error("Email error (non-blocking):", emailErr);
          }
        }
      } catch (dbError) {
        console.error("Firestore update error:", dbError);
      }
    } else {
      console.error("No valid orderId found. firestoreOrderId:", firestoreOrderId, "result.conversationId:", result.conversationId);
    }

    return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
  }
}
