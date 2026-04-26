import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
  secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
});

export async function POST(req: Request): Promise<Response> {
  try {
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

    // Prepare Buyer data
    const nameParts = customerName.trim().split(" ");
    const surname = nameParts.length > 1 ? nameParts.pop() : "User";
    const name = nameParts.join(" ") || customerName;

    // Initialize Iyzico Checkout Form
    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: orderRef.id, // Using Firestore document ID for tracking
      price: total.toString(),
      paidPrice: total.toString(),
      currency: Iyzipay.CURRENCY.USD, // Keep USD to match the frontend
      basketId: shortOrderId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/callback`,
      enabledInstallments: [2, 3, 6, 9],
      buyer: {
        id: "BY789",
        name: name,
        surname: surname,
        gsmNumber: customerPhone,
        email: customerEmail,
        identityNumber: "74300864791", // Required by Iyzico, mocked for sandbox
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
        id: item.id,
        name: item.name,
        category1: "Giyim",
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: (item.price * item.quantity).toString()
      }))
    };

    return new Promise<Response>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          console.error("Iyzico Error:", err);
          return resolve(NextResponse.json({ error: "Ödeme altyapısı hatası." }, { status: 500 }));
        }

        if (result.status === "success") {
          return resolve(NextResponse.json({ paymentPageUrl: result.paymentPageUrl }));
        } else {
          console.error("Iyzico Initialization Failed:", result);
          return resolve(NextResponse.json({ error: result.errorMessage || "Ödeme başlatılamadı." }, { status: 400 }));
        }
      });
    });

  } catch (error) {
    console.error("Checkout POST Error:", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
