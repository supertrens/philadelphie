import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { eglise } from "@/config/eglise";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: eglise.nom, template: `%s · ${eglise.nom}` },
  description: eglise.slogan,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
