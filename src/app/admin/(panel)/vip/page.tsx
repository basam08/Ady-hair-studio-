import { VipClientesClient } from "@/components/admin/VipClientesClient";

export const dynamic = "force-dynamic";

export default function VipPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Clientes VIP</h1>
      <p className="mt-2 max-w-lg text-sm text-cocoa">
        Ficha propia para clientes especiales: el color de pelo que usan, notas
        y preferencias. No depende de las reservas, la llevas tú a mano.
      </p>
      <VipClientesClient />
    </div>
  );
}
