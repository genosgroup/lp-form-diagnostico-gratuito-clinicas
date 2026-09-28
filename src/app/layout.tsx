import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Receita Oculta da Clínica",
  description: "Descubra em menos de 60 segundos o potencial estimado de receita entre pacientes que já conhecem sua clínica.",
  icons: {
    icon: [
      { url: "/images/genos-preto-150x150.png", sizes: "32x32" },
      { url: "/images/genos-preto.png", sizes: "192x192" },
    ],
    apple: "/images/genos-preto.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0D0C0B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${manrope.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
