import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import { defaultTitle, ZYRA } from "@/lib/zyra/site";
import "./globals.css";

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
  title: {
    default: defaultTitle,
    template: `%s — ${ZYRA.name}`,
  },
  description: ZYRA.description,
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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
