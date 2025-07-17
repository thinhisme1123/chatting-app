import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/src/presentation/contexts/AuthContext";
import { ChatProvider } from "@/src/presentation/contexts/ChatContext";
import { Toaster } from "react-hot-toast";

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
        <AuthProvider>
          <ChatProvider>
            <Toaster position="top-right" reverseOrder={false} />
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
