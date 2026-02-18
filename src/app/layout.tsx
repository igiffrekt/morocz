import type { Metadata } from "next";
import { plusJakartaSans } from "@/lib/fonts";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Morocz Medical",
  description: "Morocz Medical — Egészségügyi szolgáltatások Esztergomban. Foglaljon időpontot online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className={plusJakartaSans.variable}>
      <body>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
