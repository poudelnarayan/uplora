import "./globals.css";
import Providers from "./providers";
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Playfair_Display } from 'next/font/google';
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  title: 'Uplora - Team YouTube Workflow',
  description: 'Editors upload, owners approve, videos go straight to YouTube',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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
        <SpeedInsights />
      </body>
    </html>
  )
}
