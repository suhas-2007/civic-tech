import type { Metadata } from "next";
import { Newsreader, Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Civorium | Public Works Intelligence",
  description: "Civorium public infrastructure intelligence platform for transparency and coordination in municipal projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${newsreader.variable} ${inter.variable}`}>
      <body className="antialiased overflow-x-clip min-h-screen">
        {children}
      </body>
    </html>
  );
}
