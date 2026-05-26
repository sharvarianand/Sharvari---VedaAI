import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

/**
 * Outfit matches the geometric letterforms used in the Figma file
 * (flat-apex A, compact x-height, single-story g).
 */
const outfit = Outfit({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VedaAI — AI Assessment Creator",
  description:
    "Create assignments, generate AI-powered question papers, and manage grading — built for teachers.",
};

import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Analytics />
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '16px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#1a1a1a',
              },
            },
          }} 
        />
      </body>
    </html>
  );
}
