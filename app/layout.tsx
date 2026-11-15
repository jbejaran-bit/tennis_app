import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baseline Racket Lab — Find your feel",
  description:
    "Compare racket setups, plan your practice and remember what happened on court.",
  robots: {index: false, follow: false},
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
