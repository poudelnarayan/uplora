import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Uplora - Team YouTube Workflow",
  description: "Editors upload, owners approve, videos go straight to YouTube",
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