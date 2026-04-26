import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

function toPkiString(obj: Record<string, any>): string {
  const parts: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      if (typeof val[0] === 'object') {
        const inner = val.map((item) => `[${toPkiString(item)}]`).join(', ');
        parts.push(`${key}=[${inner}]`);
      } else {
        parts.push(`${key}=[${val.join(', ')}]`);
      }
    } else if (typeof val === 'object') {
      parts.push(`${key}=[${toPkiString(val)}]`);
    } else {
      parts.push(`${key}=${val}`);
    }
  }
  return parts.join(', ');
}

function generateAuth(requestObj: Record<string, any>): { authorization: string; randomKey: string } {
  const randomKey = crypto.randomBytes(16).toString('hex');
  const pkiString = `[${toPkiString(requestObj)}]`;
  const hashStr = IYZICO_API_KEY + randomKey + IYZICO_SECRET_KEY + pkiString;
  const signature = crypto.createHmac('sha256', IYZICO_SECRET_KEY)
    .update(hashStr, 'utf8')
    .digest('base64');
  return {
    authorization: `IYZWS apiKey=${IYZICO_API_KEY}&randomKey=${randomKey}&signature=${signature}`,
    randomKey,
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

    const { authorization, randomKey } = generateAuth(requestObj);

    const iyzicoRes = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'x-iyzi-rnd': randomKey,
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
    console.error("Callback POST Error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`);
  }
}
