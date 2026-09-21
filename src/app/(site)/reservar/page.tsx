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

  if (!isBookingLaunched()) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="u-eyebrow">Reserva</p>
        <h1 className="font-display mt-4 text-5xl md:text-6xl">
          Muy pronto por aquí
        </h1>
        <div className="rule-sweep mt-6 mb-10 h-px w-full bg-ink" />
        <p className="max-w-lg text-cocoa">
          Las reservas online abren el{" "}
          <strong className="text-ink">1 de octubre</strong>. Mientras tanto,
          escríbenos por WhatsApp si quieres pedir cita.
        </p>
        <a
          href={`https://wa.me/${salon.contact.whatsapp}?text=${encodeURIComponent(
            `Hola ${salon.name}, quiero pedir cita.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-8"
        >
          Escribir por WhatsApp
        </a>
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
