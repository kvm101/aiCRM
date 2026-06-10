import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { Header } from "@/components/layout/Header";
import { GlobalAIChat } from "@/components/ai/GlobalAIChat";
import { PendingToolModal } from "@/components/ai/PendingToolModal";
import { GlobalWSProvider } from "@/components/providers/GlobalWSProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI CRM",
  description: "Modular CRM with AI capabilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <GlobalWSProvider />
          <div className="flex h-screen overflow-hidden">
            <div className="hidden md:block h-full shrink-0">
              <Sidebar />
            </div>
            <MobileSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AuthGuard>{children}</AuthGuard>
              </main>
            </div>
            <GlobalAIChat />
            <PendingToolModal />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
