import { prisma } from "@/lib/db";
import { ReservasClient } from "@/components/admin/ReservasClient";

export const dynamic = "force-dynamic";

export default async function ReservasPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true },
  });
  return <ReservasClient services={services} />;
}
