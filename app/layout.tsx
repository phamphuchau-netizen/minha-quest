import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minha Tech - Taskbot",
  description: "Trợ lý nhắc việc của Phúc Hậu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body 
        suppressHydrationWarning 
        className="min-h-full flex flex-col antialiased bg-slate-100"
      >
        {children}
      </body>
    </html>
  );
}