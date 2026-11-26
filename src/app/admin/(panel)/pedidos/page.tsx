import { PedidosClient } from "@/components/admin/PedidosClient";

export const dynamic = "force-dynamic";

export default function PedidosPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Pedidos</h1>
      <p className="mt-2 max-w-lg text-sm text-cocoa">
        Productos reservados desde la tienda. El cliente paga en el salón al
        recogerlos.
      </p>
      <PedidosClient />
    </div>
  );
}
