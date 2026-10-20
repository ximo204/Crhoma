import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { HeaderSAS } from "@/components/layout/HeaderSAS";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CODEAPA y CUSEAPA — Diabetes y Heridas",
  description:
    "CODEAPA (control de diabetes) y CUSEAPA (cuidado y seguimiento de heridas) en Atención Primaria de Andalucía, sobre la base común de pacientes CRHOMA. AGS Campo de Gibraltar Este.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased`}
      >
        <HeaderSAS />
        <div className="flex-1">{children}</div>
        <footer className="px-6 py-4 text-right text-[11px] text-slate-400">
          © {new Date().getFullYear()} Francisco Javier Gómez Canto y Javier Gómez Moleón
        </footer>
      </body>
    </html>
  );
}
