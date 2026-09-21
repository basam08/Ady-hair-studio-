import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { salon, isBookingLaunched } from "@/config/salon";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Reservar cita",
  description: `Reserva tu cita en ${salon.name} en menos de un minuto, 24/7.`,
  alternates: { canonical: "/reservar" },
};

export const dynamic = "force-dynamic";

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const launched = isBookingLaunched();

  const [services, stylists] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        name: true,
        description: true,
        priceCents: true,
        durationMin: true,
        category: true,
        bookableOnline: true,
      },
    }),
    prisma.stylist.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, role: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <p className="u-eyebrow">Reserva</p>
      <h1 className="font-display mt-4 text-5xl md:text-6xl">Pide tu cita</h1>
      <div className="rule-sweep mt-6 mb-10 h-px w-full bg-ink" />

      {!launched && (
        <p className="mb-10 border border-persimmon bg-persimmon/10 px-4 py-3 text-sm text-persimmon-dark">
          Estamos en fase de pruebas: las reservas hechas antes del{" "}
          <strong>1 de octubre</strong> no se van a atender. A partir de esa
          fecha ya podrás reservar con normalidad.
        </p>
      )}

      {services.length === 0 ? (
        <p className="text-cocoa">
          Aún no hay servicios configurados. Ejecuta{" "}
          <code className="u-mono">npm run db:seed</code>.
        </p>
      ) : (
        <BookingWizard
          services={services}
          stylists={stylists}
          initialServiceSlug={servicio}
        />
      )}
    </div>
  );
}
