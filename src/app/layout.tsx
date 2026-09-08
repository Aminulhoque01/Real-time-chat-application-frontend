import type { Metadata } from "next";

import "./globals.css";
import ReduxProvider from "../redux/provider";



export const metadata: Metadata = {
  title: "ChatApp",
  description: "Real-time chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}