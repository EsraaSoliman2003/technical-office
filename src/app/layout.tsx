import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import MainProvider from "@/rtk/MainProvider";
import AppToaster from "@/components/AppToaster";
import { themeInitScript } from "@/lib/theme";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منظومة المكتب الفني",
  description: "منظومة المكتب الفني",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the theme script may add `dark` to <html> before hydration.
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${cairo.variable} font-sans antialiased`}>
        <MainProvider>{children}</MainProvider>
        <AppToaster />
      </body>
    </html>
  );
}
