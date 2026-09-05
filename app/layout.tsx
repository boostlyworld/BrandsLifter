import type { Metadata, Viewport } from "next";
import { Aboreto, Arapey, Work_Sans } from "next/font/google";

import { SITE } from "@/content/site";
import "./globals.css";

/* ── Typefaces ──────────────────────────────────────────────────────────────
   Each is exposed as a CSS custom property and consumed in globals.css as
   --ff-display / --ff-accent / --ff-body. `display: "swap"` keeps the painted
   backgrounds from sitting behind invisible text while a webfont loads. */

/** Headings and the wordmark. Aboreto ships a single weight. */
const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aboreto",
  display: "swap",
});

/** Accent voice: the word "Lift", eyebrows, testimonial quotes. Italic only. */
const arapey = Arapey({
  weight: "400",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-arapey",
  display: "swap",
});

/** Everything you actually read: body, nav, form. */
const workSans = Work_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  /* Matches --c-earth. Keeps the mobile browser chrome from flashing white. */
  themeColor: "#292b1f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${aboreto.variable} ${arapey.variable} ${workSans.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
