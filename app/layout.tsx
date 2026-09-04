import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Internet Time Machine",
    template: "%s — Internet Time Machine",
  },
  description:
    "Street View for the Internet. Search any website, travel through its archived history, compare eras and measure how it evolved.",
  openGraph: {
    title: "Internet Time Machine",
    description:
      "Travel through the history of the Internet. Explore real archived websites, compare eras, and measure evolution.",
    type: "website",
    siteName: "Internet Time Machine",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-ink text-fog antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
