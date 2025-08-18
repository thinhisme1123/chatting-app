import { AuthProvider } from "@/src/presentation/contexts/AuthContext";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { ThemeProvider } from "@/src/presentation/contexts/ThemeContext";
import { LanguageProvider } from "@/src/presentation/contexts/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat Application",
  description: "Connect with friends and family through real-time messaging",
  icons: {
    icon: "/chat_messages.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Toaster position="top-right" reverseOrder={false} />
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
