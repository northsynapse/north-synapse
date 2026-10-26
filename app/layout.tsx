
import './globals.css';

export const metadata = {
  title: 'North Synapse Platform',
  description: 'Next-Generation Academic Knowledge Exchange',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
