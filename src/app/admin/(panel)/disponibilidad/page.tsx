import { hoursSummary, salon } from "@/config/salon";
import { DisponibilidadClient } from "@/components/admin/DisponibilidadClient";

export const dynamic = "force-dynamic";

export default function DisponibilidadPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Disponibilidad</h1>

      <section className="mt-8">
        <h2 className="u-eyebrow">Horario habitual</h2>
        <p className="mt-2 max-w-lg text-sm text-cocoa">
          El horario semanal, los peluqueros ({salon.stylists.length}) y los
          festivos fijos se definen en{" "}
          <code className="u-mono">src/config/salon.ts</code>. Para cierres
          puntuales o descansos, usa los bloqueos de abajo.
        </p>
        <ul className="mt-4 max-w-sm u-mono text-sm">
          {hoursSummary().map((row) => (
            <li
              key={row.label}
              className="flex justify-between border-t border-line py-2"
            >
              <span>{row.label}</span>
              <span className="text-cocoa">{row.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="u-eyebrow">Bloqueos puntuales</h2>
        <p className="mt-2 max-w-lg text-sm text-cocoa">
          Un bloqueo elimina esos huecos del calendario público (vacaciones,
          formación, una tarde libre). No afecta a las citas ya reservadas.
        </p>
        <DisponibilidadClient />
      </section>
    </div>
  );
}
