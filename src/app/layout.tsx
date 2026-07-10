import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AutoParts Pro | قطع غيار سيارات موثوقة",
  description: "اعثر على قطعة الغيار المناسبة لسيارتك من متاجر معتمدة، مع دفع آمن وتوصيل يمكن تتبعه.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="h-full font-sans antialiased dark">
      <body className="relative flex min-h-full flex-col bg-background text-foreground transition-colors duration-300">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/15 via-background to-background" />
        <Navbar />
        <main className="z-0 flex flex-grow flex-col">{children}</main>
      </body>
    </html>
  );
}
