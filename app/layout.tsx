
import "./globals.css";

export const metadata = {
  title: {
    default: "North Synapse",
    template: "%s | North Synapse",
  },
  description:
    "A student learning community for sharing academic resources, joining study rooms, and exchanging ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
