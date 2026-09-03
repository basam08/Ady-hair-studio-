import { ClientesClient } from "@/components/admin/ClientesClient";

export const dynamic = "force-dynamic";

export default function ClientesPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Clientes</h1>
      <p className="mt-2 max-w-lg text-sm text-cocoa">
        Ficha creada automáticamente con la primera reserva, identificada por el
        teléfono. Los clientes con más visitas aparecen marcados como habituales.
      </p>
      <ClientesClient />
    </div>
  );
}
