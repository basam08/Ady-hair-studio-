import type { Metadata } from "next";
import "./globals.css";
import { salon } from "@/config/salon";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${salon.name} · Peluquería en ${salon.contact.address.city}`,
    template: `%s · ${salon.name}`,
  },
  description: salon.intro,
  keywords: [
    "peluquería",
    salon.contact.address.city,
    "corte de pelo",
    "barbería",
    "reservar cita peluquería",
  ],
  openGraph: {
    title: salon.name,
    description: salon.intro,
    type: "website",
    locale: "es_ES",
    url: siteUrl,
    images: ["/salon/interior-1.jpg"],
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:ital,wght@0,500;0,600;0,700;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
