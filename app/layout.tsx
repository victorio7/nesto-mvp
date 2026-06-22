import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nesto",
  description: "Votre bras droit commercial en immobilier, pilote depuis WhatsApp."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
