import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Effects } from "@/components/Effects";
import { SITE } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Sydney Airport Transfers, Taxi & Chauffeur`, template: `%s · ${SITE.name}` },
  description: "Book premium Sydney airport transfers, taxis and chauffeur cars. Fixed prices, flight tracking, meet & greet and live driver tracking. 24/7 across Greater Sydney.",
  openGraph: { type: "website", locale: "en_AU", siteName: SITE.name, images: ["/hero.png"] },
};

export const viewport: Viewport = { themeColor: "#0a0c12" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] btn btn-gold btn-sm">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Effects />
      </body>
    </html>
  );
}
