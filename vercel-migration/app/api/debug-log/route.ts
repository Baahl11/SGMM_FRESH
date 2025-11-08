import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({ error: "Invalid JSON" }));

  console.log("[debug-log]", payload);

  return NextResponse.json({ ok: true });
}
