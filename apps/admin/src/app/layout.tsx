export const metadata = {
  title: "Uplora Admin",
  description: "Administrative Portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://www.uplora.io/icon.png" sizes="any" />
        <link rel="apple-touch-icon" href="https://www.uplora.io/icon.png" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body>{children}</body>
    </html>
  );
}


