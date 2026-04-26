import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

const IYZICO_API_KEY = process.env.IYZICO_API_KEY || '';
const IYZICO_SECRET_KEY = process.env.IYZICO_SECRET_KEY || '';
const IYZICO_BASE_URL = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com';

// Generate PKI string from object (Iyzico's specific format)
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
  try {
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return NextResponse.json({
        error: "Iyzico API anahtarları eksik. Lütfen Vercel ortam değişkenlerini kontrol edin."
      }, { status: 500 });
    }

    const body = await req.json();
    const { customerName, customerEmail, customerPhone, address, items, total } = body;

    // Create a pending order in Firestore
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

    // Prepare buyer name/surname
    const nameParts = customerName.trim().split(" ");
    const surname = nameParts.length > 1 ? nameParts.pop()! : "Kullanici";
    const name = nameParts.join(" ") || customerName;

    // Format phone: Iyzico expects +90XXXXXXXXXX
    const rawPhone = customerPhone.replace(/\D/g, '');
    const phone = rawPhone.startsWith('90') ? `+${rawPhone}` : `+90${rawPhone}`;

    const totalFormatted = total.toFixed(2);

    const requestObj = {
      locale: "tr",
      conversationId: orderRef.id,
      price: totalFormatted,
      paidPrice: totalFormatted,
      currency: "TRY",
      basketId: shortOrderId,
      paymentGroup: "PRODUCT",
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app'}/api/checkout/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: orderRef.id,
        name,
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
        id: item.id ? String(item.id) : "ITEM",
        name: item.name,
        category1: "Giyim",
        itemType: "PHYSICAL",
        price: (item.price * item.quantity).toFixed(2)
      }))
    };

    const { authorization, randomKey } = generateAuthHeader(requestObj);

    const iyzicoRes = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
        'x-iyzi-rnd': randomKey,
      },
      body: JSON.stringify(requestObj),
    });

    const result = await iyzicoRes.json();
    console.log("Iyzico response:", JSON.stringify(result));

    if (result.status === "success" && result.paymentPageUrl) {
      return NextResponse.json({ paymentPageUrl: result.paymentPageUrl });
    } else {
      console.error("Iyzico error:", result);
      return NextResponse.json({
        error: result.errorMessage || result.errorCode || "Iyzico ödeme başlatılamadı."
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Checkout POST Error:", error);
    return NextResponse.json({ error: "Sunucu hatası: " + error.message }, { status: 500 });
  }
}
