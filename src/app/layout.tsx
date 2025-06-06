import { TempoInit } from "@/components/tempo-init";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GoogleReviewPrompt } from "@/components/google-review-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Revi - Reviews through the power of Voice",
  description: "A modern full-stack starter template powered by Next.js",
  icons: {
    icon: "/images/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        {children}
        <TempoInit />
        <Toaster />
        <GoogleReviewPrompt 
          placeId="YOUR_GOOGLE_PLACE_ID"
          suggestedReview="Your custom review text here..."
        />
      </body>
    </html>
  );
}
