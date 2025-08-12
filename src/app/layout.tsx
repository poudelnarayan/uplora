import "./globals.css";
import Providers from "./providers";

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
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}