import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
    if (!IYZICO_API_KEY || !IYZICO_SECRET_KEY) {
      return NextResponse.json({ error: "Iyzico API anahtarları eksik. Lütfen Vercel ortam değişkenlerini kontrol edin." }, { status: 500 });
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
    const surname = nameParts.length > 1 ? nameParts.pop()! : "User";
    const name = nameParts.join(" ") || customerName;

    // Format phone: Iyzico expects +90XXXXXXXXXX
    const phone = customerPhone.startsWith('+') ? customerPhone : `+90${customerPhone}`;

    const requestBody = {
      locale: "tr",
      conversationId: orderRef.id,
      price: total.toFixed(2),
      paidPrice: total.toFixed(2),
      currency: "TRY",
      basketId: shortOrderId,
      paymentGroup: "PRODUCT",
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://voite.vercel.app'}/api/checkout/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: orderRef.id,
        name: name,
        surname: surname,
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
        address: address,
        zipCode: "34742"
      },
      billingAddress: {
        contactName: customerName,
        city: "Istanbul",
        country: "Turkey",
        address: address,
        zipCode: "34742"
      },
      basketItems: items.map((item: any) => ({
        id: item.id || String(Math.random()),
        name: item.name,
        category1: "Giyim",
        itemType: "PHYSICAL",
        price: (item.price * item.quantity).toFixed(2)
      }))
    };

    const requestBodyStr = JSON.stringify(requestBody);
    const authHeader = generateAuthHeader(requestBodyStr);

    const iyzicoRes = await fetch(`${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'x-iyzi-rnd': authHeader.split('randomKey=')[1]?.split('&')[0] || '',
      },
      body: requestBodyStr,
    });

    const result = await iyzicoRes.json();

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
