// services/frontend/src/app/api/health/route.ts
// Liveness / readiness probe endpoint for K8s.

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
