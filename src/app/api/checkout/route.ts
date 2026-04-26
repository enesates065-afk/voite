import { NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import crypto from 'crypto';
import { Resend } from 'resend';

// Trim to remove any accidental whitespace/newlines from copy-paste
const IYZICO_API_KEY = (process.env.IYZICO_API_KEY || '').trim();
const IYZICO_SECRET_KEY = (process.env.IYZICO_SECRET_KEY || '').trim();
const IYZICO_BASE_URL = (process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com').trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();

const API_PATH = '/payment/iyzipos/checkoutform/initialize/auth/ecom';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * IYZWSv2 auth — exact port of iyzipay-node v2 SDK (utils.js generateHashV2)
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

/**
 * Send order confirmation email to customer and notification to admin
 */
async function sendOrderEmails(order: {
  orderId: string;
  customerName: string;
  customerEmail: string;
  address: string;
  items: any[];
  total: number;
}) {
  if (!resend) return;

  const itemsHtml = order.items.map((item: any) =>
    `<tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">${item.name} ${item.size ? `(${item.size})` : ''}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;text-align:right;font-family:monospace;">₺${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#000;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:580px;margin:0 auto;padding:48px 32px;">
        <h1 style="font-size:28px;font-weight:300;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">VOITÉ.</h1>
        <p style="color:#555;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 48px;">Sipariş Onayı</p>
        
        <h2 style="font-size:14px;font-weight:400;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 4px;">Siparişiniz Alındı</h2>
        <p style="color:#666;font-size:12px;margin:0 0 32px;">Sipariş No: <strong style="color:#fff;font-family:monospace;">${order.orderId}</strong></p>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
          <thead>
            <tr style="background:#111;">
              <th style="padding:12px 16px;text-align:left;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">Ürün</th>
              <th style="padding:12px 16px;text-align:center;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">Adet</th>
              <th style="padding:12px 16px;text-align:right;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#666;">Tutar</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:16px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Toplam</td>
              <td style="padding:16px;text-align:right;font-family:monospace;font-size:16px;font-weight:bold;">₺${order.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="background:#0a0a0a;border:1px solid #1a1a1a;padding:24px;margin-bottom:32px;">
          <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#666;margin:0 0 8px;">Teslimat Adresi</p>
          <p style="font-size:13px;color:#fff;margin:0;">${order.customerName}</p>
          <p style="font-size:12px;color:#888;margin:4px 0 0;">${order.address}</p>
        </div>
        
        <p style="color:#444;font-size:11px;line-height:1.8;margin:0;">
          Siparişiniz hazırlanmaya başlandı. Kargo bilgileriniz e-posta ile iletilecektir.<br>
          Sorularınız için: <a href="mailto:${ADMIN_EMAIL}" style="color:#fff;">${ADMIN_EMAIL}</a>
        </p>
        
        <div style="margin-top:48px;padding-top:24px;border-top:1px solid #111;">
          <p style="font-size:10px;color:#333;letter-spacing:0.1em;">VOITÉ. — Exclusive Streetwear</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Email to customer
    await resend.emails.send({
      from: 'VOITÉ. <noreply@voite.app>',
      to: order.customerEmail,
      subject: `Sipariş Onayı — ${order.orderId}`,
      html: customerHtml,
    });

    // Notification to admin
    if (ADMIN_EMAIL) {
      await resend.emails.send({
        from: 'VOITÉ. <noreply@voite.app>',
        to: ADMIN_EMAIL,
        subject: `Yeni Sipariş: ${order.orderId} — ₺${order.total}`,
        html: `<h2>Yeni sipariş alındı</h2><p>Sipariş No: ${order.orderId}</p><p>Müşteri: ${order.customerName} (${order.customerEmail})</p><p>Toplam: ₺${order.total}</p><p>Adres: ${order.address}</p>`,
      });
    }
  } catch (emailErr) {
    console.error('Email send error (non-blocking):', emailErr);
  }
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

    // Decrease stock for each item (non-blocking, best-effort)
    for (const item of items) {
      if (item.slug || item.id) {
        const productId = item.slug || item.id.split('-')[0];
        try {
          const productRef = doc(db, "products", productId);
          await runTransaction(db, async (transaction) => {
            const productSnap = await transaction.get(productRef);
            if (productSnap.exists()) {
              const currentStock = productSnap.data().stock || 0;
              const newStock = Math.max(0, currentStock - item.quantity);
              transaction.update(productRef, { stock: newStock });
            }
          });
        } catch (stockErr) {
          console.error(`Stock update failed for ${productId}:`, stockErr);
        }
      }
    }

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
      // Send emails asynchronously (don't await - don't block the redirect)
      sendOrderEmails({ orderId: shortOrderId, customerName, customerEmail, address, items, total });
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
