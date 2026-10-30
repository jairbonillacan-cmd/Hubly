import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Figtree,
  Instrument_Serif,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Young_Serif,
} from "next/font/google";
import "./globals.css";
import { THEME_INIT_SCRIPT } from "@/lib/theme-init";

const wordmark = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-wordmark",
});

const display = Bricolage_Grotesque({
  axes: ["opsz", "wdth"],
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Hubly: todas las marcas de tu agencia, en un solo lugar",
  description:
    "Plataforma de código abierto para que las agencias de marketing programen publicaciones, armen parrillas, consigan aprobaciones y entreguen reportes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable} ${jakarta.variable} ${wordmark.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
