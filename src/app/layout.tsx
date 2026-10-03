import type { Metadata } from "next";

import "./globals.css";

import ReduxProvider from "../redux/provider";

import PushNotificationProvider from "@/src/components/providers/PushNotificationProvider";
import ChatNotificationToast from "../components/chat/ChatNotificationToast";

import ThemeProvider from "@/src/components/providers/ThemeProvider";
import ThemeToggle from "@/src/components/common/ThemeToggle";

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
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <ReduxProvider>
            <PushNotificationProvider />

            <ChatNotificationToast />

            {children}
          </ReduxProvider>

          {/* Global Theme Button */}
          <div className="fixed right-5 top-5 z-[9999]">
            <ThemeToggle />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}