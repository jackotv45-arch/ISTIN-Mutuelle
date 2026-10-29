import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Montserrat } from "next/font/google";
import { PlatformProvider } from "@/lib/platform-store";
import { MotionEffects } from "@/components/ui/MotionEffects";
import { PwaRegister } from "@/components/ui/PwaRegister";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ISTIN Mutuelle — La vie étudiante, ensemble",
    template: "%s | ISTIN Mutuelle",
  },
  description: "Informations, actualités et services de la Mutuelle ISTIN.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ISTIN MUTUELLE",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
  openGraph: {
    locale: "fr_GA",
    siteName: "ISTIN Mutuelle",
    title: "ISTIN Mutuelle",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b63ab",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className="min-h-full flex flex-col bg-white text-[#212529] font-sans">
        <PlatformProvider>
          <Suspense fallback={null}>
            <ScrollToTop />
          </Suspense>
          <MotionEffects />
          <PwaRegister />
          {children}
        </PlatformProvider>
      </body>
    </html>
  );
}
