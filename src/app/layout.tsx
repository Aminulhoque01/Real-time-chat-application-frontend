import type { Metadata } from "next";

import "./globals.css";

import ReduxProvider from "../redux/provider";

import PushNotificationProvider from "@/src/components/providers/PushNotificationProvider";
import ChatNotificationToast from "../components/chat/ChatNotificationToast";

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
        <ReduxProvider>
          <PushNotificationProvider />
           <ChatNotificationToast />

          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}