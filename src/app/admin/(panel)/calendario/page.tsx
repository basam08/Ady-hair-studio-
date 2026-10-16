import { prisma } from "@/lib/db";
import { CalendarioClient } from "@/components/admin/CalendarioClient";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [services, stylists] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.stylist.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  return <CalendarioClient services={services} stylists={stylists} />;
}
