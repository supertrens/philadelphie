import { Fraunces, Inter } from "next/font/google";

export const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
export const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

export const fontClass = `${inter.variable} ${fraunces.variable} h-full scroll-smooth antialiased`;
