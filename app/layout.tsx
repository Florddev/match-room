"use client";

import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth-context";
import { SearchProvider } from "@/lib/search-context";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <SearchProvider>
            <Navbar />
            <main>{children}</main>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}