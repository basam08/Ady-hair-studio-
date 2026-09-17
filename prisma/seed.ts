import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { salon } from "../src/config/salon";

const prisma = new PrismaClient();

async function main() {
  // ── Administrador ─────────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL ?? "ady@adyhaircut.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "AdyDemo2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    create: { email, passwordHash, name: "Ady" },
    update: { passwordHash },
  });
  console.log(`✔ Admin: ${email}`);

  // ── Servicios (desde src/config/salon.ts) ─────────────────────
  for (const [i, s] of salon.services.entries()) {
    const bookableOnline = s.bookableOnline ?? true;
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        priceCents: Math.round(s.price * 100),
        durationMin: s.durationMin,
        category: s.category,
        bookableOnline,
        sortOrder: i,
      },
      update: {
        name: s.name,
        description: s.description,
        priceCents: Math.round(s.price * 100),
        durationMin: s.durationMin,
        category: s.category,
        bookableOnline,
        sortOrder: i,
      },
    });
  }
  console.log(`✔ ${salon.services.length} servicios`);

  // ── Peluqueros (desde src/config/salon.ts) ─────────────────────
  for (const [i, st] of salon.stylists.entries()) {
    await prisma.stylist.upsert({
      where: { slug: st.slug },
      create: { slug: st.slug, name: st.name, role: st.role, sortOrder: i },
      update: { name: st.name, role: st.role, sortOrder: i },
    });
  }
  console.log(`✔ ${salon.stylists.length} peluqueros`);

  // ── Reservas de ejemplo (solo si no hay ninguna) ──────────────
  const count = await prisma.booking.count();
  if (count === 0) {
    const services = await prisma.service.findMany();
    const bySlug = new Map(services.map((s) => [s.slug, s]));
    const stylists = await prisma.stylist.findMany();
    const demoClients = [
      { name: "María López", phone: "+34611223344", email: "maria@example.com" },
      { name: "Carlos Ruiz", phone: "+34622334455", email: null },
      { name: "Nadia Ben", phone: "+34633445566", email: "nadia@example.com" },
    ];

    const now = new Date();
    let made = 0;
    for (let d = 0; d < 6; d++) {
      for (const [ci, c] of demoClients.entries()) {
        if ((d + ci) % 2 === 0) continue;
        const svc =
          bySlug.get(
            ["corte-hombre", "corte-mujer", "arreglo-barba", "color-raiz"][
              (d + ci) % 4
            ],
          ) ?? services[0];
        const start = new Date(now);
        start.setDate(start.getDate() + d + 1);
        start.setHours(10 + ((d + ci) % 6), (ci % 2) * 30, 0, 0);
        const end = new Date(start.getTime() + svc.durationMin * 60_000);

        const client = await prisma.client.upsert({
          where: { phone: c.phone },
          create: { name: c.name, phone: c.phone, email: c.email },
          update: {},
        });

        const stylist = stylists[ci % stylists.length];

        await prisma.booking.create({
          data: {
            manageToken: randomBytes(24).toString("base64url"),
            clientId: client.id,
            serviceId: svc.id,
            serviceName: svc.name,
            priceCents: svc.priceCents,
            durationMin: svc.durationMin,
            stylistId: stylist?.id,
            startsAt: start,
            endsAt: end,
            chair: 1,
          },
        });
        made++;
      }
    }
    console.log(`✔ ${made} reservas de ejemplo`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
