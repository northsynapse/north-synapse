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
      <head>
        {/* 引入 Tailwind CSS CDN，无需 PostCSS/Tailwind 插件配置 */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
