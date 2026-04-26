import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

// Trim to remove any accidental whitespace/newlines from copy-paste
const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();

const API_PATH = '/payment/iyzipos/checkoutform/initialize/auth/ecom';

/**
 * IYZWSv2 auth — exact port of iyzipay-node v2 SDK (utils.js generateHashV2)
 *   signature = HMAC-SHA256-hex(secretKey, randomString + apiPath + JSON.stringify(body))
 *   authParams = "apiKey:KEY&randomKey:RANDOM&signature:HEX"
 *   header = "IYZWSv2 " + base64(authParams)
 */
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
  try {
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return NextResponse.json({
        error: "Iyzico API anahtarları eksik. Vercel → Settings → Environment Variables bölümünden IYZICO_API_KEY ve IYZICO_SECRET_KEY ekleyin."
      }, { status: 500 });
    }

    const body = await req.json();
    const { customerName, customerEmail, customerPhone, address, items, total } = body;

    // Create pending order in Firestore
    const shortOrderId = "VOI-" + Math.floor(100000 + Math.random() * 900000).toString();

    const orderRef = await addDoc(collection(db, "orders"), {
      orderId: shortOrderId,
      customerName,
      customerEmail,
      customerPhone,
      address,
      items,
      total,
      status: "Bekliyor",
      paymentStatus: "Pending",
      createdAt: serverTimestamp()
    });

    // Split name / surname
    const nameParts = customerName.trim().split(/\s+/);
    const surname = nameParts.length > 1 ? nameParts.pop()! : "Kullanici";
    const firstName = nameParts.join(" ") || customerName;

    // Normalize phone → +90XXXXXXXXXX
    const digits = customerPhone.replace(/\D/g, '');
    const phone = digits.startsWith('90') ? `+${digits}` : `+90${digits}`;

    const price = Number(total).toFixed(2);

    const requestBody = {
      locale: "tr",
      conversationId: orderRef.id,
      price,
      paidPrice: price,
      currency: "TRY",
      basketId: shortOrderId,
      paymentGroup: "PRODUCT",
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app'}/api/checkout/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: orderRef.id,
        name: firstName,
        surname,
        gsmNumber: phone,
        email: customerEmail,
        identityNumber: "74300864791",
        lastLoginDate: "2015-10-05 12:43:35",
        registrationDate: "2013-04-21 15:12:09",
        registrationAddress: address,
        ip: "85.34.78.112",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34732"
      },
      shippingAddress: {
        contactName: customerName,
        city: "Istanbul",
        country: "Turkey",
        address,
        zipCode: "34742"
      },
      billingAddress: {
        contactName: customerName,
        city: "Istanbul",
        country: "Turkey",
        address,
        zipCode: "34742"
      },
      basketItems: items.map((item: any) => ({
        id: String(item.id || 'ITEM'),
        name: item.name,
        category1: "Giyim",
        itemType: "PHYSICAL",
        price: Number(item.price * item.quantity).toFixed(2)
      }))
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
    console.log("Iyzico response:", JSON.stringify(result));

    if (result.status === "success" && result.paymentPageUrl) {
      return NextResponse.json({ paymentPageUrl: result.paymentPageUrl });
    }

    return NextResponse.json({
      error: result.errorMessage || result.errorCode || "Iyzico ödeme başlatılamadı."
    }, { status: 400 });

  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 });
  }
}
