import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import Script from "next/script";
import { GaDevLogger, GoogleAnalyticsRouteViews } from "@/components/analytics/google-analytics";
import { defaultTitle, ZYRA } from "@/lib/zyra/site";
import "./globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_ID?.trim();
const gaEnabled = Boolean(gaMeasurementId);


const sans = DM_Sans({
  variable: "--font-sans-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Lora({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: defaultTitle,
    template: `%s — ${ZYRA.name}`,
  },
  description: ZYRA.description,
  keywords: [
    "women's health companion",
    "period tracker",
    "cycle tracking",
    "PCOS support",
    "symptom tracker",
    "women's health AI assistant",
  ],
  openGraph: {
    title: defaultTitle,
    description: ZYRA.description,
    type: "website",
    siteName: ZYRA.name,
    images: [{ url: "/zyra-icon.png", width: 512, height: 512, alt: `${ZYRA.name} logo` }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: ZYRA.description,
    images: ["/zyra-icon.png"],
  },
  icons: {
    icon: [
      { url: "/zyra-icon.svg", type: "image/svg+xml" },
      { url: "/zyra-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/zyra-icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/zyra-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/zyra-icon.png", sizes: "512x512", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {gaEnabled && gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { send_page_view: true });
`}
            </Script>
            <GoogleAnalyticsRouteViews gaId={gaMeasurementId} />
          </>
        ) : null}
        {process.env.NODE_ENV === "development" ? (
          <GaDevLogger configured={gaEnabled} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
