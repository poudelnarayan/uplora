import "./globals.css";
import Providers from "./providers";
import { ClerkProvider } from '@clerk/nextjs';

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
      <body>
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
      </body>
    </html>
  )
}
