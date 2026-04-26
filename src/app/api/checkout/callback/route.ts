import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

function pkiString(obj: Record<string, any>): string {
  const parts: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (Array.isArray(val) && val.length > 0) {
      if (typeof val[0] === 'object') {
        for (const item of val) {
          parts.push(`${key}=${pkiString(item)}`);
        }
      } else {
        parts.push(`${key}=[${val.join(',')}]`);
      }
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      parts.push(`${key}=${pkiString(val)}`);
    } else {
      parts.push(`${key}=${val}`);
    }
  }
  return `[${parts.join(',')}]`;
}

function buildAuth(requestObj: Record<string, any>): { authorization: string; randomString: string } {
  const randomString = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 8);
  const pki = pkiString(requestObj);
  const hashStr = IYZICO_API_KEY + randomString + IYZICO_SECRET_KEY + pki;
  const hash = crypto.createHmac('sha256', IYZICO_SECRET_KEY)
    .update(hashStr, 'utf8')
    .digest('base64');
  return {
    authorization: `IYZWS ${IYZICO_API_KEY}:${hash}`,
    randomString,
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

    const requestObj: Record<string, any> = {
      locale: "tr",
      conversationId: "callback-verify",
      token,
    };

    const { authorization, randomString } = buildAuth(requestObj);

    const iyzicoRes = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'x-iyzi-rnd': randomString,
          'x-iyzi-client-version': 'iyzipay-node-custom-1.0.0',
        },
        body: JSON.stringify(requestObj),
      }
    );

    const result = await iyzicoRes.json();
    console.log("Callback result:", JSON.stringify(result));

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`);
    }

    const orderId = result.conversationId;
    if (orderId && orderId !== "callback-verify") {
      try {
        await updateDoc(doc(db, "orders", orderId), {
          status: "Ödendi",
          paymentStatus: "Success",
          paymentId: result.paymentId,
          updatedAt: new Date()
        });
      } catch (dbError) {
        console.error("Firestore update error:", dbError);
      }
    }

    return NextResponse.redirect(`${SITE_URL}/checkout/success`);

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`);
  }
}
