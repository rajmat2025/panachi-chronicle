import type { Metadata, Viewport } from "next";
import { Noto_Serif, Noto_Sans_Malayalam, Noto_Serif_Malayalam } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-noto-serif",
  display: "swap",
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-malayalam",
  display: "swap",
});

const notoSerifMalayalam = Noto_Serif_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-serif-malayalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panachickal Family Chronicle",
  description:
    "An interactive digital chronicle of the Panachickal family — a page-turning book of generations.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#5c4228",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${notoSerif.variable} ${notoMalayalam.variable} ${notoSerifMalayalam.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
