import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api";
import { getDashboardStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => {
  return NextResponse.json(await getDashboardStats());
});
