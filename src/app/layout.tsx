import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Finanza - Control de Finanzas",
  description: "Gestiona tus finanzas en pareja",
  metadataBase: new URL("https://finance-sepia-five.vercel.app"),
  openGraph: {
    title: "Finanza - Control de Finanzas",
    description: "Gestiona tus finanzas en pareja",
    images: [{ url: "/logo-meta.png", width: 1200, height: 1200 }],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1F1F23",
              border: "1px solid rgba(250,250,250,0.08)",
              color: "#FAFAF5",
            },
            classNames: {
              success: "[&_[data-icon]]:text-[#2D8659]",
              error: "[&_[data-icon]]:text-[#B83A3A]",
              warning: "[&_[data-icon]]:text-[#C4A876]",
            },
          }}
        />
      </body>
    </html>
  );
}
