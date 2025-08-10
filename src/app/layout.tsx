import "./globals.css";
import { Providers } from "./providers";

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
          <div className="relative min-h-screen overflow-hidden">
            {/* Floating orbs background */}
            <div className="orb w-96 h-96 top-[-10%] left-[-10%] floating" />
            <div className="orb w-64 h-64 top-[20%] right-[-5%] floating-delayed" />
            <div className="orb w-48 h-48 bottom-[10%] left-[10%] floating" />
            <div className="orb w-80 h-80 bottom-[-15%] right-[5%] floating-delayed" />
            
            {/* Main content */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}