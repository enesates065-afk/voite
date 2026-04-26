import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

function toPkiString(obj: any): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) {
    return obj.map((item) => `[${toPkiString(item)}]`).join(',');
  }
  return Object.keys(obj)
    .map((key) => {
      const val = obj[key];
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) {
        return val.map((item) => `${key}=[${toPkiString(item)}]`).join(',');
      }
      if (typeof val === 'object') {
        return `${key}=[${toPkiString(val)}]`;
      }
      return `${key}=${val}`;
    })
    .filter(Boolean)
    .join(',');
}

function generateAuthHeader(requestObj: any): { authorization: string; randomKey: string } {
  const randomKey = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const pkiString = `[${toPkiString(requestObj)}]`;
  const hashStr = IYZICO_API_KEY + randomKey + IYZICO_SECRET_KEY + pkiString;
  const signature = crypto.createHmac('sha256', IYZICO_SECRET_KEY)
    .update(hashStr)
    .digest('base64');
  return {
    authorization: `IYZWS apiKey=${IYZICO_API_KEY}&randomKey=${randomKey}&signature=${signature}`,
    randomKey
  };
}

export async function POST(req: Request): Promise<Response> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app';

  try {
    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`);
    }

    const requestObj = {
      locale: "tr",
      conversationId: "callback-check",
      token
    };

    const { authorization, randomKey } = generateAuthHeader(requestObj);

    const iyzicoRes = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomKey,
      },
      body: JSON.stringify(requestObj),
    });

    const result = await iyzicoRes.json();
    console.log("Callback result:", JSON.stringify(result));

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      console.error("Iyzico Callback Error:", result);
      return NextResponse.redirect(`${SITE_URL}/checkout/error`);
    }

    const orderId = result.conversationId;

    if (orderId && orderId !== "callback-check") {
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
    return NextResponse.redirect(`${SITE_URL}/checkout/error`);
  }
}
