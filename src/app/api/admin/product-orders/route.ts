import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withAdmin(async () => {
  const orders = await prisma.productOrder.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ orders });
});
