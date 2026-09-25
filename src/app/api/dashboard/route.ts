import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/database";
import type { DashboardData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): NextResponse<DashboardData> {
  return NextResponse.json(getDashboardData());
}
