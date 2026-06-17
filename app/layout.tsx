import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider, ToastViewport } from "../components/ui/toast";
import { ToastManager } from "../components/ui/toast-manager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskCode TAD - Gestión de Actividades",
  description: "Plataforma de gestión de actividades para desarrolladores — TAD Consultoría",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <ToastManager>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastManager>
          <ToastViewport />
        </ToastProvider>
      </body>
    </html>
  );
}
