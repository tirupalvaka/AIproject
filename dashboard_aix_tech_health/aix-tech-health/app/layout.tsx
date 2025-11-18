// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIX Tech Health",
  description: "ADX-powered Technical Health dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">AIX Technical Health</h1>
            <p className="text-slate-600">Live scores from ADX</p>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

