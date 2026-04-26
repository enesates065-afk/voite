import { NextResponse } from 'next/server';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();

const API_PATH = '/payment/iyzipos/checkoutform/auth/ecom/detail';

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

    if (!token) {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

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
    console.log("Callback result:", JSON.stringify(result));

    if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
      return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
    }

    // conversationId was set to orderRef.id in the checkout route
    const orderId = result.conversationId;
    if (orderId && orderId.length > 10) {  // Firestore IDs are ~20 chars
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

    return NextResponse.redirect(`${SITE_URL}/checkout/success`, { status: 303 });

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${SITE_URL}/checkout/error`, { status: 303 });
  }
}
