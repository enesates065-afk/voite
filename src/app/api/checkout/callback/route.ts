import { NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";


export async function POST(req: Request): Promise<Response> {
  try {
    let Iyzipay;
    try {
      Iyzipay = require('iyzipay');
    } catch (err: any) {
      console.error("Failed to load Iyzipay:", err);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/error`);
    }

    const iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
      secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
      uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
    });

    const formData = await req.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/error`);
    }

    // Retrieve payment details using token
    return new Promise<Response>((resolve) => {
      iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        conversationId: '123456789', // Arbitrary for retrieve, but we rely on result.conversationId
        token: token
      } as any, async (err: any, result: any) => {
        
        if (err || result.status !== "success" || result.paymentStatus !== "SUCCESS") {
          console.error("Iyzico Callback Error:", err || result);
          return resolve(NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/error`));
        }

        // result.conversationId was set to orderRef.id in the initialization
        const orderId = result.conversationId;
        
        if (orderId) {
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

        return resolve(NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success`));
      });
    });

  } catch (error) {
    console.error("Callback POST Error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/error`);
  }
}
