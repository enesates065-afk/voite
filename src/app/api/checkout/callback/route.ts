import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

function generateAuthHeader(body: string): string {
  const randomString = Math.random().toString(36).substring(2);
  const dataToSign = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + body;
  const signature = crypto.createHmac('sha256', IYZICO_SECRET_KEY)
    .update(dataToSign)
    .digest('base64');
  return `IYZWS apiKey=${IYZICO_API_KEY}&randomKey=${randomString}&signature=${signature}`;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app';

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`);
    }

    const requestBody = JSON.stringify({
      locale: "tr",
      conversationId: "callback",
      token: token
    });

    const authHeader = generateAuthHeader(requestBody);

    const iyzicoRes = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-iyzi-rnd': authHeader.split('randomKey=')[1]?.split('&')[0] || '',
      },
      body: requestBody,
    });

    const result = await iyzicoRes.json();

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("Iyzico Callback Error:", result);
      return NextResponse.redirect(`${SITE_URL}/checkout/error`);
    }

    // result.conversationId was set to Firestore orderRef.id during initialization
    const orderId = result.conversationId;

    if (orderId && orderId !== "callback") {
      try {
        const orderRef = doc(db, "orders", orderId);
        await updateDoc(orderRef, {
          status: "Ödendi",
          paymentStatus: "Success",
          paymentId: result.paymentId,
          updatedAt: new Date()
        });
      } catch (dbError) {
        console.error("Error updating order in Firestore:", dbError);
      }
    }

    return NextResponse.redirect(`${SITE_URL}/checkout/success`);

  } catch (error) {
    console.error("Callback POST Error:", error);
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app';
    return NextResponse.redirect(`${SITE_URL}/checkout/error`);
  }
}
