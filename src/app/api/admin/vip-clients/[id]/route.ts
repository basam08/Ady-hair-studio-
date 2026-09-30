import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const DELETE = withAdmin(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;
    await prisma.vipClient.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  },
);
