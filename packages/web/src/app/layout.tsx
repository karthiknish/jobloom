import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { Toaster } from "react-hot-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobloomMonorepo - Job Tracker",
  description: "Track your job applications and highlight sponsored roles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} antialiased`}>
          <ConvexClientProvider>
            <Header />
            {children}
            <Footer />
            <Toaster position="top-right" />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
