import type { Metadata } from "next";
import "./globals.css";
import FirebaseInitializer from "@/components/FirebaseInitializer";
import { FirebaseAuthProvider } from "@/providers/firebase-auth-provider";
import { AppToaster } from "@/components/ui/Toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import MobileNavigation from "@/components/MobileNavigation";
import { inter } from "@/font";

export const metadata: Metadata = {
  title: "HireAll - Job Tracker",
  description: "Track your job applications and highlight sponsored roles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <FirebaseInitializer />
        <FirebaseAuthProvider>
          <Header />
          {children}
          <Footer />
          <MobileNavigation />
          <AppToaster />
          <Chatbot />
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
