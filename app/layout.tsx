"use client";

import Navbar from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";
import { SearchProvider } from "@/lib/search-context";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbarPaths = ['/auth/login', '/auth/register', '/auth/logout'];
  const shouldShowNavbar = !hideNavbarPaths.some(path => pathname?.startsWith(path));

  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <SearchProvider>
            {shouldShowNavbar && <Navbar />}
            <main>{children}</main>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}