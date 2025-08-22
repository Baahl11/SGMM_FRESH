import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PATHS = [
  "patients","treatments","inventory","records","dashboard","stats",
  "status","appointments","billing","gastos-fijos","inventory_movements","inventory2search"
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  console.log(`[MW] path= ${pathname}  search= ${search}`);

  // 🚨 TEMPORAL: Desactivado rewrite automático para usar API routes estáticas
  // 1) Si es /api/<algo> pero NO /api/proxy → reescribir a /api/proxy/<algo>
  // if (pathname.startsWith("/api/") && !pathname.startsWith("/api/proxy/")) {
  //   const rewriteUrl = new URL(`/api/proxy${pathname.slice(4)}${search}`, req.url);
  //   console.log(`[MW] ✅ API rewrite: ${pathname} → ${rewriteUrl.pathname}`);
  //   return NextResponse.rewrite(rewriteUrl);
  // }

  // 2) Si es un endpoint directo conocido → /api/proxy/<endpoint>
  const hit = PATHS.some(p => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
  if (hit) {
    const rewriteUrl = new URL(`/api/proxy${pathname}${search}`, req.url);
    console.log(`[MW] ✅ Direct endpoint rewrite: ${pathname} → ${rewriteUrl.pathname}`);
    return NextResponse.rewrite(rewriteUrl);
  }

  // 3) Si es /dashboard/<recurso-api> → /api/proxy/<recurso>  
  const parts = pathname.replace(/^\/+/, "").split("/");
  if (parts[0] === "dashboard" && parts[1] && PATHS.includes(parts[1])) {
    const rewriteUrl = new URL(`/api/proxy/${parts.slice(1).join("/")}${search}`, req.url);
    console.log(`[MW] ✅ Dashboard rewrite: ${pathname} → ${rewriteUrl.pathname}`);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = { 
  matcher: [
    // CRÍTICO: Asegurar que /api/* sea capturado
    "/api/:path*",
    "/(patients|treatments|inventory|records|dashboard|stats|status|appointments|billing|gastos-fijos|inventory_movements|inventory2search)/:path*",
    "/((?!_next/static|_next/image|favicon.ico|__next).*)"
  ]
};
