import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api";
import { formatBookingSheet } from "@/lib/integrations/google-sheets";

export const dynamic = "force-dynamic";

// Endpoint temporal: aplica la plantilla de formato a la hoja de Google
// Sheets de reservas. Se dispara una vez desde el navegador (logueado
// como admin) y luego se elimina esta ruta.
export const POST = withAdmin(async () => {
  const result = await formatBookingSheet();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
});
