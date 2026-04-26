import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

/**
 * Converts a request object to Iyzico's PKI string format.
 * Mirrors the exact behaviour of the official iyzipay Node.js SDK.
 * Format: [key=value, key2=[nested=val], arrayKey=[[a=1], [a=2]]]
 */
function toPkiString(obj: Record<string, any>): string {
  const parts: string[] = [];

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      if (typeof val[0] === 'object') {
        // Array of objects: arrayKey=[[k=v, k2=v2], [k=v, k2=v2]]
        const inner = val.map((item) => `[${toPkiString(item)}]`).join(', ');
        parts.push(`${key}=[${inner}]`);
      } else {
        // Array of primitives: enabledInstallments=[1, 2, 3]
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
  try {
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return NextResponse.json({
        error: "Iyzico API anahtarları eksik. Vercel Environment Variables bölümünden ekleyin."
      }, { status: 500 });
    }

    const body = await req.json();
    const { customerName, customerEmail, customerPhone, address, items, total } = body;

    // Create a pending order in Firestore first
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

    const requestObj: Record<string, any> = {
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

    const { authorization, randomKey } = generateAuth(requestObj);

    const iyzicoRes = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
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
