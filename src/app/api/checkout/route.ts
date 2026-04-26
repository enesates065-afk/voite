import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';

// Trim to remove any accidental whitespace/newlines from copy-paste
const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();

/**
 * Exact port of the official iyzipay-node SDK's Pki.requestToString()
 * https://github.com/iyzico/iyzipay-node/blob/master/lib/pki/Pki.js
 */
function pkiString(obj: Record<string, any>): string {
  const parts: string[] = [];

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) continue;

    if (Array.isArray(val) && val.length > 0) {
      if (typeof val[0] === 'object') {
        // Array of objects — each element gets its OWN key entry
        for (const item of val) {
          parts.push(`${key}=${pkiString(item)}`);
        }
      } else {
        // Array of primitives e.g. enabledInstallments=[1,2,3]
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

/**
 * Exact port of the official iyzipay-node SDK's IyziAuth
 * Authorization header: "IYZWS {apiKey}:{base64-hmac-sha256}"
 * x-iyzi-rnd header: the random string used in the hash
 */
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

    const { authorization, randomString } = buildAuth(requestObj);

    // Debug log - will appear in Vercel logs
    console.log("=== IYZICO DEBUG ===");
    console.log("API Key length:", IYZICO_API_KEY.length, "starts with:", IYZICO_API_KEY.substring(0, 10));
    console.log("Secret Key length:", IYZICO_SECRET_KEY.length);
    console.log("Base URL:", IYZICO_BASE_URL);
    console.log("PKI:", JSON.stringify(pkiString(requestObj)).substring(0, 200));
    console.log("Auth header:", authorization.substring(0, 50) + "...");
    console.log("Random string:", randomString);
    console.log("====================");

    const iyzicoRes = await fetch(
      `${IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom`,
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
