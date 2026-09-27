"use client";

import { useSelector } from "react-redux";

import { RootState } from "@/src/redux/store";

import { usePushNotification } from "@/src/hooks/usePushNotification";

export default function PushNotificationProvider() {
  const user = useSelector(
    (state: RootState) => state.auth.user,
  );

  usePushNotification({
    userId: user?._id,
  });

  return null;
}