import "./globals.css";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ClerkProvider } from '@clerk/nextjs';

export const metadata = {
  title: "Uplora - Team YouTube Workflow",
  description: "Editors upload, owners approve, videos go straight to YouTube",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/icon.png?v=2", sizes: "16x16", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "48x48", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "64x64", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "128x128", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "256x256", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/icon.png?v=2"],
    apple: [
      { url: "/icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    var theme = localStorage.getItem('uplora-theme');
                    if (theme && theme !== 'dark') {
                      document.documentElement.setAttribute('data-theme', theme);
                    }
                  } catch (e) {
                    // Keep default dark theme if localStorage fails
                  }
                })();
              `,
            }}
          />
        </head>
        <body>
          <ErrorBoundary>
            <Providers>
              {children}
            </Providers>
          </ErrorBoundary>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('uplora-theme');
                  if (theme && theme !== 'dark') {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  // Keep default dark theme if localStorage fails
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClerkProvider>
          <ErrorBoundary>
            <Providers>
              {children}
            </Providers>
          </ErrorBoundary>
        </ClerkProvider>
        <Analytics />
      </body>
    </html>
  );
}