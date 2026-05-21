import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baseline — Tennis Performance Intelligence",
  description:
    "Track every match. See every pattern. Train with an AI coach that knows your game.",
  keywords: ["tennis", "performance", "tracking", "AI", "coaching", "UTR"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-baseline-dark antialiased">
        {children}
      </body>
    </html>
  );
}
