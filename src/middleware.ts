import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sadece /admin ile başlayan rotaları koru
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Host header'dan gerçek adresi al
  const host = request.headers.get("host") || "";
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";

  // Vercel production'da ALWAYS_BLOCK_ADMIN env var set edilirse engelle
  const alwaysBlock = process.env.BLOCK_ADMIN_ON_PROD === "true";

  // Localhost kontrolü: host localhost ya da 127.0.0.1 mi?
  const isLocalhost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("::1") ||
    host.startsWith("[::1]");

  // Eğer production ortamıysa (Vercel) ve localhost değilse → engelle
  // NODE_ENV production'da Vercel tarafından set edilir
  const isProduction = process.env.NODE_ENV === "production";

  if (alwaysBlock || (isProduction && !isLocalhost)) {
    // 404 döndür — admin varlığını bile belli etme
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
