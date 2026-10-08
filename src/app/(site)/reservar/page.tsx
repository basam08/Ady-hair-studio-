import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { salon, isBookingPaused, bookingReopensAt } from "@/config/salon";
import { formatDateInZone, formatTimeInZone } from "@/lib/time";
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

  if (isBookingPaused()) {
    const reopensAt = bookingReopensAt()!;
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="u-eyebrow">Reserva</p>
        <h1 className="font-display mt-4 text-5xl md:text-6xl">Pide tu cita</h1>
        <div className="rule-sweep mt-6 mb-10 h-px w-full bg-ink" />
        <p className="border border-persimmon bg-persimmon/10 px-4 py-3 text-sm text-persimmon-dark">
          Las reservas online están cerradas por ahora. Vuelven a abrirse el{" "}
          <strong>
            {formatDateInZone(salon.timeZone, reopensAt)} a las{" "}
            {formatTimeInZone(salon.timeZone, reopensAt)}
          </strong>
          . Mientras tanto puedes escribirnos por WhatsApp:{" "}
          <a
            href={`https://wa.me/${salon.contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline"
          >
            {salon.contact.whatsappDisplay}
          </a>
          .
        </p>
      </div>
    );
  }

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
        isExtra: true,
        priceFrom: true,
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
