import Link from "next/link";
import { getDashboardStats } from "@/lib/stats";
import { formatPriceCents, salon } from "@/config/salon";
import { formatTimeInZone } from "@/lib/time";

export const dynamic = "force-dynamic";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-line bg-cream p-5">
      <p className="u-mono text-xs uppercase tracking-widest text-cocoa">
        {label}
      </p>
      <p className="font-display mt-2 text-4xl">{value}</p>
      {hint && <p className="u-mono mt-1 text-xs text-cocoa">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-4xl">Panel</h1>
        <p className="u-mono text-xs text-cocoa">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Ocupación 7 días"
          value={`${stats.occupancyNext7}%`}
          hint={`${salon.chairs} sillas`}
        />
        <Stat label="Citas hoy" value={String(stats.todayCount)} />
        <Stat
          label="Ingresos 7 días"
          value={formatPriceCents(stats.weekRevenueCents)}
          hint="confirmadas + completadas"
        />
        <Stat
          label="Clientes nuevos"
          value={String(stats.newClientsThisMonth)}
          hint="este mes"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="u-eyebrow">Agenda de hoy</h2>
          {stats.todayAgenda.length === 0 ? (
            <p className="mt-4 text-sm text-cocoa">No hay citas hoy.</p>
          ) : (
            <ul className="mt-4">
              {stats.todayAgenda.map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-t border-line py-3 last:border-b"
                >
                  <span className="u-mono text-sm">
                    {formatTimeInZone(salon.timeZone, new Date(a.time))}
                  </span>
                  <div>
                    <p className="text-sm">{a.serviceName}</p>
                    <p className="u-mono text-xs text-cocoa">
                      {a.client} · {a.phone} · silla {a.chair}
                    </p>
                  </div>
                  <span
                    className={`u-mono text-xs uppercase ${
                      a.status === "COMPLETED"
                        ? "text-sage"
                        : "text-cocoa"
                    }`}
                  >
                    {a.status === "COMPLETED" ? "hecha" : "pendiente"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/reservas"
            className="u-mono mt-4 inline-block text-xs uppercase tracking-widest link-underline"
          >
            Ver todas las reservas →
          </Link>
        </section>

        <section>
          <h2 className="u-eyebrow">Servicios del mes</h2>
          <ul className="mt-4">
            {stats.topServices.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between border-t border-line py-3 last:border-b"
              >
                <span className="text-sm">{s.name}</span>
                <span className="u-mono text-xs text-cocoa">
                  {s.count} · {formatPriceCents(s.revenueCents)}
                </span>
              </li>
            ))}
            {stats.topServices.length === 0 && (
              <li className="py-3 text-sm text-cocoa">Sin datos aún.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
