import { CartProvider } from "@/components/shop/CartProvider";
import { CartBar } from "@/components/shop/CartControls";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <CartBar />
    </CartProvider>
  );
}
