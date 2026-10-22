import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { PublicChrome } from "@/components/PublicChrome";
import { Effects } from "@/components/Effects";
import { SITE } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — Premium Taxi & Limousine Services`, template: `%s · ${SITE.name}` },
  description: "Book premium Sydney Airport transfers, taxis and luxury limousine vehicle services. Fixed prices, flight tracking, meet & greet and live driver tracking 24/7.",
  openGraph: { type: "website", locale: "en_AU", siteName: SITE.name, images: ["/hero.png"] },
};

export const viewport: Viewport = { themeColor: "#0a0c12" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <PublicChrome>
          {children}
        </PublicChrome>
        <Effects />
      </body>
    </html>
  );
}
