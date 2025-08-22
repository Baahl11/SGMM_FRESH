import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Cambia aquí si lo necesitas
const BACKEND = (process.env.SGMM_BACKEND || "http://127.0.0.1:8000").replace(/\/+$/,"");

function targetUrl(req: NextRequest, pathParts: string[]) {
  const path = (pathParts || []).join("/");
  const qs   = new URL(req.url).search;              // incluye ?...
  
  // El backend FastAPI NO usa /api/ prefix, usar path directo
  // Construir la URL completa correctamente
  const finalUrl = `${BACKEND}/${path}${qs}`;
  
  console.log(`🔗 PROXY URL: ${pathParts.join('/')} → ${finalUrl}`);
  return finalUrl;
}

async function proxy(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const params = await ctx.params;
  const parts = params.path || [];
  if (!parts.length) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const url = targetUrl(req, parts);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("x-sgmm-proxy", "1");
  headers.set("x-sgmm-proxy-target", url);
  
  // 🔓 AGREGAR HEADERS DE AUTH BYPASS PARA DESARROLLO
  headers.set("x-sgmm-dev", "1");
  headers.set("authorization", "Bearer dev");
  
  // También pasar la variable de entorno si existe
  if (process.env.SGMM_BYPASS_AUTH === "1") {
    console.log("🔓 PROXY: Auth bypass header added");
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["GET","HEAD"].includes(req.method) ? undefined : await req.arrayBuffer(),
    // @ts-ignore — necesario para streaming en Node 18/20
    duplex: "half",
  };

  try {
    const resp = await fetch(url, init);
    const out = new Headers(resp.headers);
    out.set("x-sgmm-proxy-target", url);
    return new NextResponse(resp.body, { status: resp.status, headers: out });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Proxy fetch failed", message: String(e), target: url },
      { status: 502 }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS };
