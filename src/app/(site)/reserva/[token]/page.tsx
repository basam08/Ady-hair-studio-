import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ManageBooking } from "@/components/booking/ManageBooking";

export const metadata: Metadata = {
  title: "Gestionar mi cita",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { client: true, service: { select: { slug: true } } },
  });

  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
      <Link
        href="/"
        className="u-mono text-xs uppercase tracking-widest link-underline"
      >
        ← Ady Hair Cut
      </Link>
      <h1 className="font-display mt-6 text-4xl md:text-5xl">Gestionar cita</h1>
      <div className="rule-sweep mt-6 mb-10 h-px w-full bg-ink" />

      <ManageBooking
        token={token}
        serviceSlug={booking.service.slug}
        serviceName={booking.serviceName}
        startsAt={booking.startsAt.toISOString()}
        status={booking.status}
        clientName={booking.client.name}
      />
    </div>
  );
}
