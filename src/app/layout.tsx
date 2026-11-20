import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pakistan WeatherWatch — Historical Weather Intelligence",
  description:
    "Premium historical weather intelligence dashboard analyzing daily climate data for Lahore, Karachi, Islamabad, Peshawar and Quetta (2024–2025) from the Open-Meteo Historical Weather API.",
  keywords: [
    "Pakistan",
    "weather",
    "historical weather",
    "climate dashboard",
    "Open-Meteo",
    "data analysis",
    "Lahore",
    "Karachi",
    "Islamabad",
    "Peshawar",
    "Quetta",
  ],
  authors: [{ name: "Pakistan WeatherWatch" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Pakistan WeatherWatch",
    description:
      "Historical weather intelligence across five major Pakistani cities, 2024–2025.",
    siteName: "Pakistan WeatherWatch",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
