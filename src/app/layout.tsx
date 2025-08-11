import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "YTUploader - Team Video Management",
  description: "Collaborate on YouTube video uploads with your team",
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