import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AmbientMeshBackground } from "@/components/visuals/ambient-mesh-background";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Money and hours are set in mono throughout, so columns of figures line up
// and a salary never reflows as you type.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "CareerEdge — what the market actually pays",
    template: "%s · CareerEdge",
  },
  description:
    "Score the return on a new skill, price a cross-border remote offer against real local costs, and get it reviewed by people in the same market.",
  openGraph: {
    title: "CareerEdge",
    description:
      "Skill ROI, cost-of-living adjusted pay, CTC to in-hand, and a job description simplifier that shows what a posting is really saying.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {/* Fixed behind everything, so the field is continuous across routes
              and doesn't restart on navigation. Negative z sits above the body
              background but below all content. */}
          <AmbientMeshBackground className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
