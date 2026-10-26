
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "North Synapse",
  description: "A learning community built for curious minds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
