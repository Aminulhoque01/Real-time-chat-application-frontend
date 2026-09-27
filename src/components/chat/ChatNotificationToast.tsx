 
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import {
  CHAT_NOTIFICATION_EVENT_NAME,
  ChatNotificationData,
} from "@/src/lib/chat-notification";

// ==========================================
// TYPES
// ==========================================

interface NotificationItem
  extends ChatNotificationData {
  id: string;
}

// ==========================================
// COMPONENT
// ==========================================

export default function ChatNotificationToast() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  // ==========================================
  // CREATE AUDIO
  // ==========================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio(
      "/notification.mp3",
    );

    audio.preload = "auto";

    audioRef.current = audio;

    return () => {
      audio.pause();

      audio.currentTime = 0;

      audioRef.current = null;
    };
  }, []);

  // ==========================================
  // PLAY NOTIFICATION SOUND
  // ==========================================

  const playNotificationSound = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    try {
      audio.pause();

      audio.currentTime = 0;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(
            "Notification sound could not play:",
            error,
          );
        });
      }
    } catch (error) {
      console.error(
        "Notification sound error:",
        error,
      );
    }
  };

  // ==========================================
  // LISTEN NOTIFICATION EVENT
  // ==========================================

  useEffect(() => {
    const handleNotification = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<ChatNotificationData>;

      const data = customEvent.detail;

      if (!data) {
        return;
      }

      // ======================================
      // CREATE NOTIFICATION
      // ======================================

      const notification: NotificationItem = {
        ...data,

        id:
          data.messageId ||
          `${Date.now()}-${Math.random()}`,
      };

      // ======================================
      // ADD TOAST
      // ======================================

      setNotifications((previous) => [
        ...previous,
        notification,
      ]);

      // ======================================
      // PLAY SOUND
      // ======================================

      playNotificationSound();

      // ======================================
      // AUTO REMOVE AFTER 5 SECONDS
      // ======================================

      window.setTimeout(() => {
        setNotifications((previous) =>
          previous.filter(
            (item) =>
              item.id !== notification.id,
          ),
        );
      }, 5000);
    };

    window.addEventListener(
      CHAT_NOTIFICATION_EVENT_NAME,
      handleNotification,
    );

    return () => {
      window.removeEventListener(
        CHAT_NOTIFICATION_EVENT_NAME,
        handleNotification,
      );
    };
  }, []);

  // ==========================================
  // REMOVE NOTIFICATION
  // ==========================================

  const removeNotification = (
    id: string,
  ) => {
    setNotifications((previous) =>
      previous.filter(
        (item) => item.id !== id,
      ),
    );
  };

  // ==========================================
  // IMAGE ERROR HANDLER
  // ==========================================

  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
  ) => {
    const image =
      event.currentTarget;

    // Prevent infinite error loop
    image.onerror = null;

    // Fallback to notification icon
    image.src =
      "/notification-icon.png";
  };

  // ==========================================
  // NOTHING TO SHOW
  // ==========================================

  if (notifications.length === 0) {
    return null;
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="
        fixed
        right-5
        top-5
        z-[99999]
        flex
        w-[360px]
        max-w-[calc(100vw-24px)]
        flex-col
        gap-3
      "
    >
      {notifications.map(
        (notification) => (
          <div
            key={notification.id}
            className="
              relative
              overflow-hidden
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-4
              shadow-2xl
              dark:border-gray-700
              dark:bg-gray-900
            "
          >
            {/* ================================= */}
            {/* CLOSE BUTTON */}
            {/* ================================= */}

            <button
              type="button"
              onClick={() =>
                removeNotification(
                  notification.id,
                )
              }
              className="
                absolute
                right-2
                top-2
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900
                dark:hover:bg-gray-800
                dark:hover:text-white
              "
              aria-label="Close notification"
            >
              <X size={16} />
            </button>

            {/* ================================= */}
            {/* CONTENT */}
            {/* ================================= */}

            <div className="flex gap-3 pr-6">
              {/* ================================= */}
              {/* SENDER PROFILE IMAGE */}
              {/* ================================= */}

              <div
                className="
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-gray-100
                  dark:bg-gray-800
                "
              >
                <img
                  src={
                    notification.senderAvatar ||
                    "/notification-icon.png"
                  }
                  alt={
                    notification.title ||
                    "Notification"
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                  onError={
                    handleImageError
                  }
                />
              </div>

              {/* ================================= */}
              {/* TEXT */}
              {/* ================================= */}

              <div className="min-w-0 flex-1">
                {/* SENDER NAME */}

                <p
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-gray-900
                    dark:text-white
                  "
                >
                  {notification.title}
                </p>

                {/* MESSAGE */}

                <p
                  className="
                    mt-1
                    line-clamp-2
                    break-words
                    text-sm
                    text-gray-600
                    dark:text-gray-300
                  "
                >
                  {notification.body}
                </p>

                {/* LABEL */}

                <p
                  className="
                    mt-2
                    text-xs
                    text-gray-400
                  "
                >
                  New message
                </p>
              </div>

              {/* ================================= */}
              {/* SMALL NOTIFICATION ICON */}
              {/* ================================= */}

              <div
                className="
                  absolute
                  bottom-4
                  right-4
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-white
                  bg-white
                  shadow
                  dark:border-gray-800
                  dark:bg-gray-800
                "
              >
                <img
                  src="/notification-icon.png"
                  alt="Notification"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              </div>
            </div>

            {/* ================================= */}
            {/* PROGRESS BAR */}
            {/* ================================= */}

            <div
              className="
                absolute
                bottom-0
                left-0
                h-1
                w-full
                origin-left
                animate-[notification-progress_5s_linear]
                bg-blue-500
              "
            />
          </div>
        ),
      )}
    </div>
  );
}
 
