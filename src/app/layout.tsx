import "./globals.css";
import type { Viewport } from "next";
import Providers from "./providers";
import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/app/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Uplora - Team YouTube Workflow',
  description: 'Editors upload, owners approve, videos go straight to YouTube',
}

// Without an explicit viewport, mobile browsers default to ~980px width and
// scale the page to fit — which makes every page render "zoomed in" until the
// user pinches out. Setting width=device-width + initial-scale=1 fixes this.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // allow user pinch-zoom up to 5x for accessibility
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            <Providers>
              {children}
            </Providers>
          </ClerkProvider>
        ) : (
          <Providers>
            {children}
          </Providers>
        )}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  )
}
