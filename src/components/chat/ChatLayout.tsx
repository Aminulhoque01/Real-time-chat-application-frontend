"use client";

import {
  useCallback,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";
import ProfileModal from "../ProfileModal/ProfileModal";

import type { MessageSendPayload } from "./MessageComposer";

import {
  useAppDispatch,
  useAppSelector,
} from "@/src/redux/hooks";

import { baseApi } from "@/src/redux/api/baseApi";

import {
  conversationApi,
  useGetConversationsQuery,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useSendMessageMutation,
} from "@/src/redux/features/message/messageApi";

import {
  useGetUserProfileQuery,
  useGetBlockStatusQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useUpdateMyAvatarMutation,
  useUpdateMyProfileMutation,
} from "@/src/redux/features/auth/authApi";

import {
  logout,
  updateUser,
} from "@/src/redux/features/auth/authSlice";

import type { Message } from "@/src/redux/features/message/message.types";

import useChatSocket from "@/src/hooks/useChatSocket";

export default function ChatLayout() {
  // =====================================================
  // ROUTER
  // =====================================================

  const router = useRouter();

  // =====================================================
  // REDUX DISPATCH
  // =====================================================

  const dispatch = useAppDispatch();

  // =====================================================
  // AUTH USER
  // =====================================================

  const user = useAppSelector(
    (state) => state.auth.user,
  );

  // =====================================================
  // CONVERSATIONS
  // =====================================================

  const {
    data: conversations = [],
  } = useGetConversationsQuery();

  // =====================================================
  // SELECTED CONVERSATION
  // =====================================================

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<string | null>(null);

  // =====================================================
  // REPLY MESSAGE
  // =====================================================

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<Message | null>(null);

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const [
    sendMessage,
    {
      isLoading: isSending,
    },
  ] = useSendMessageMutation();

  // =====================================================
  // TYPING USER
  // =====================================================

  const [
    typingUserId,
    setTypingUserId,
  ] = useState<string | null>(null);

  // =====================================================
  // PROFILE MODAL
  // =====================================================

  const [
    isProfileOpen,
    setIsProfileOpen,
  ] = useState(false);

  const [
    profileUserId,
    setProfileUserId,
  ] = useState<string | null>(null);

  // =====================================================
  // EDIT PROFILE MODE
  // =====================================================

  const [
    isEditingProfile,
    setIsEditingProfile,
  ] = useState(false);

  const [
    editName,
    setEditName,
  ] = useState("");

  const [
    editBio,
    setEditBio,
  ] = useState("");

  // =====================================================
  // SELECTED CONVERSATION DATA
  // =====================================================

  const selectedConversation =
    conversations.find(
      (conversation) =>
        String(conversation._id) ===
        String(selectedConversationId),
    ) ?? null;

  // =====================================================
  // TYPING USER DATA
  // =====================================================

  const typingUser =
    selectedConversation?.participants.find(
      (participant) =>
        String(participant._id) ===
        String(typingUserId),
    );

  const typingUserName =
    typingUser?.name ||
    typingUser?.phone ||
    "Someone";

  // =====================================================
  // TYPING START
  // =====================================================

  const handleTypingStart = useCallback(
    (userId: string) => {
      setTypingUserId(userId);
    },
    [],
  );

  // =====================================================
  // TYPING STOP
  // =====================================================

  const handleTypingStop = useCallback(
    (userId: string) => {
      setTypingUserId((currentUserId) => {
        if (
          String(currentUserId) ===
          String(userId)
        ) {
          return null;
        }

        return currentUserId;
      });
    },
    [],
  );

  // =====================================================
  // SOCKET
  // =====================================================

  const {
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    deleteMessageRealtime,
    editMessageRealtime,
    toggleMessageReactionRealtime,
    disconnectSocket,
  } = useChatSocket({
    conversationId:
      selectedConversationId,

    onTypingStart:
      handleTypingStart,

    onTypingStop:
      handleTypingStop,
  });

  // =====================================================
  // PROFILE API
  // =====================================================

  const {
    data: fetchedProfileUser,
  } = useGetUserProfileQuery(
    profileUserId as string,
    {
      skip:
        !profileUserId ||
        String(profileUserId) ===
          String(user?._id),
    },
  );

  // =====================================================
  // BLOCK STATUS
  // =====================================================

  const {
    data: blockStatus,
    isLoading:
      isBlockStatusLoading,
  } = useGetBlockStatusQuery(
    profileUserId as string,
    {
      skip:
        !profileUserId ||
        String(profileUserId) ===
          String(user?._id),
    },
  );

  // =====================================================
  // BLOCK USER
  // =====================================================

  const [
    blockUser,
    {
      isLoading: isBlocking,
    },
  ] = useBlockUserMutation();

  // =====================================================
  // UNBLOCK USER
  // =====================================================

  const [
    unblockUser,
    {
      isLoading: isUnblocking,
    },
  ] = useUnblockUserMutation();

  // =====================================================
  // UPDATE AVATAR
  // =====================================================

  const [
    updateMyAvatar,
    {
      isLoading:
        isUploadingAvatar,
    },
  ] = useUpdateMyAvatarMutation();

  // =====================================================
  // UPDATE PROFILE
  // =====================================================

  const [
    updateMyProfile,
    {
      isLoading:
        isUpdatingProfile,
    },
  ] = useUpdateMyProfileMutation();

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async (
    payload: MessageSendPayload,
  ) => {
    try {
      if (!selectedConversationId) {
        return;
      }

      /*
       * MessageComposer already prepares the
       * message payload.
       *
       * We only attach replyTo here when
       * there is an active reply.
       */

      const messagePayload = {
        ...payload,
        conversationId:
          selectedConversationId,

        ...(replyingTo?._id
          ? {
              replyTo:
                replyingTo._id,
            }
          : {}),
      };

      await sendMessage(
        messagePayload,
      ).unwrap();

      /*
       * Clear reply mode after successful send.
       *
       * Realtime message update is handled
       * by Socket.IO / existing RTK Query flow.
       */

      setReplyingTo(null);
    } catch (error) {
      console.error(
        "Send message failed:",
        error,
      );
    }
  };

  // =====================================================
  // SELECT CONVERSATION
  // =====================================================

  const handleSelectConversation = (
    conversationId: string,
  ) => {
    setTypingUserId(null);

    setReplyingTo(null);

    setIsProfileOpen(false);

    setProfileUserId(null);

    setIsEditingProfile(false);

    setEditName("");

    setEditBio("");

    // ==========================================
    // CLEAR UNREAD COUNT
    // ==========================================

    dispatch(
      conversationApi.util.updateQueryData(
        "getConversations",
        undefined,
        (draft) => {
          const conversation =
            draft.find(
              (item) =>
                String(item._id) ===
                String(conversationId),
            );

          if (!conversation) {
            return;
          }

          conversation.unreadCount = 0;
        },
      ),
    );

    setSelectedConversationId(
      conversationId,
    );

    setIsSidebarOpen(false);
  };

  // =====================================================
  // REPLY MESSAGE
  // =====================================================

  const handleReplyMessage = (
    message: Message,
  ) => {
    setReplyingTo(message);
  };

  // =====================================================
  // CANCEL REPLY
  // =====================================================

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // =====================================================
  // EDIT MESSAGE
  // =====================================================

  const handleEditMessage = (
    messageId: string,
    text: string,
  ): boolean => {
    if (!messageId) {
      return false;
    }

    if (!text.trim()) {
      return false;
    }

    return editMessageRealtime(
      messageId,
      text,
    );
  };

  // =====================================================
  // REACTION
  // =====================================================

  const handleReactionMessage = (
    messageId: string,
    emoji: string,
  ): boolean => {
    if (!messageId) {
      return false;
    }

    if (!emoji) {
      return false;
    }

    return toggleMessageReactionRealtime(
      messageId,
      emoji,
    );
  };

  // =====================================================
  // OPEN SIDEBAR
  // =====================================================

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  // =====================================================
  // CLOSE SIDEBAR
  // =====================================================

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // =====================================================
  // OPEN OTHER USER PROFILE
  // =====================================================

  const handleOpenProfile = () => {
    if (!selectedConversation) {
      return;
    }

    if (
      selectedConversation.type !==
      "direct"
    ) {
      return;
    }

    const otherUser =
      selectedConversation.participants.find(
        (participant) =>
          String(participant._id) !==
          String(user?._id),
      );

    if (!otherUser) {
      return;
    }

    setIsEditingProfile(false);

    setEditName("");

    setEditBio("");

    setProfileUserId(
      String(otherUser._id),
    );

    setIsProfileOpen(true);
  };

  // =====================================================
  // OPEN OWN PROFILE
  // =====================================================

  const handleOpenOwnProfile = () => {
    if (!user?._id) {
      return;
    }

    setIsEditingProfile(false);

    setEditName("");

    setEditBio("");

    setProfileUserId(
      String(user._id),
    );

    setIsProfileOpen(true);
  };

  // =====================================================
  // CLOSE PROFILE
  // =====================================================

  const handleCloseProfile = () => {
    setIsProfileOpen(false);

    setProfileUserId(null);

    setIsEditingProfile(false);

    setEditName("");

    setEditBio("");
  };

  // =====================================================
  // START EDIT PROFILE
  // =====================================================

  const handleStartEditProfile = () => {
    if (!user) {
      return;
    }

    setEditName(
      user.name ?? "",
    );

    setEditBio(
      user.bio ?? "",
    );

    setIsEditingProfile(true);
  };

  // =====================================================
  // CANCEL EDIT PROFILE
  // =====================================================

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);

    setEditName("");

    setEditBio("");
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = async () => {
    if (!user?._id) {
      return;
    }

    const name =
      editName.trim();

    const bio =
      editBio.trim();

    if (!name) {
      return;
    }

    try {
      const updatedUser =
        await updateMyProfile({
          name,
          bio,
        }).unwrap();

      // ==========================================
      // UPDATE REDUX AUTH USER
      // ==========================================

      dispatch(
        updateUser(updatedUser),
      );

      // ==========================================
      // EXIT EDIT MODE
      // ==========================================

      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");
    } catch (error) {
      console.error(
        "Profile update failed:",
        error,
      );
    }
  };

  // =====================================================
  // AVATAR CHANGE
  // =====================================================

  const handleAvatarChange = async (
    file: File,
  ) => {
    if (!user?._id) {
      return;
    }

    try {
      const formData =
        new FormData();

      formData.append(
        "avatar",
        file,
      );

      const updatedUser =
        await updateMyAvatar(
          formData,
        ).unwrap();

      // ==========================================
      // UPDATE REDUX USER
      // ==========================================

      dispatch(
        updateUser(updatedUser),
      );
    } catch (error) {
      console.error(
        "Avatar update failed:",
        error,
      );
    }
  };

  // =====================================================
  // BLOCK USER
  // =====================================================

  const handleBlockUser = async () => {
    if (!profileUserId) {
      return;
    }

    try {
      await blockUser(
        profileUserId,
      ).unwrap();
    } catch (error) {
      console.error(
        "Block user failed:",
        error,
      );
    }
  };

  // =====================================================
  // UNBLOCK USER
  // =====================================================

  const handleUnblockUser = async () => {
    if (!profileUserId) {
      return;
    }

    try {
      await unblockUser(
        profileUserId,
      ).unwrap();
    } catch (error) {
      console.error(
        "Unblock user failed:",
        error,
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    try {
      // ==========================================
      // CLOSE UI
      // ==========================================

      setIsProfileOpen(false);

      setProfileUserId(null);

      setReplyingTo(null);

      setSelectedConversationId(
        null,
      );

      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");

      // ==========================================
      // DISCONNECT SOCKET
      // ==========================================

      disconnectSocket();

      // ==========================================
      // CLEAR AUTH
      // ==========================================

      dispatch(logout());

      // ==========================================
      // CLEAR RTK QUERY CACHE
      // ==========================================

      dispatch(
        baseApi.util.resetApiState(),
      );

      // ==========================================
      // LOGIN PAGE
      // ==========================================

      router.replace("/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error,
      );

      router.replace("/login");
    }
  };

  // =====================================================
  // TYPING STATUS
  // =====================================================

  const isTyping =
    typingUserId !== null &&
    String(typingUserId) !==
      String(user?._id);

  // =====================================================
  // PROFILE USER
  // =====================================================

  const isOwnProfile =
    String(profileUserId) ===
    String(user?._id);

  const profileUser =
    isOwnProfile
      ? user
      : fetchedProfileUser ?? null;

  // =====================================================
  // BLOCK LOADING
  // =====================================================

  const isBlockLoading =
    isBlocking ||
    isUnblocking ||
    isBlockStatusLoading;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="
        relative
        flex
        h-screen
        min-h-0
        overflow-hidden
        bg-slate-50
      "
    >
      {/* =================================================
          CHAT SIDEBAR
      ================================================= */}

      <ChatSidebar
        selectedConversationId={
          selectedConversationId
        }
        onSelectConversation={
          handleSelectConversation
        }
        isOpen={
          isSidebarOpen
        }
        onClose={
          handleCloseSidebar
        }
        onOpenProfile={
          handleOpenOwnProfile
        }
      />

      {/* =================================================
          MOBILE SIDEBAR OVERLAY
      ================================================= */}

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={
            handleCloseSidebar
          }
          className="
            absolute
            inset-0
            z-30
            bg-black/20
            lg:hidden
          "
        />
      )}

      {/* =================================================
          CHAT UI
      ================================================= */}

      <ChatUI
        conversation={
          selectedConversation
        }
        currentUserId={
          user?._id
        }
        onOpenSidebar={
          handleOpenSidebar
        }
        onOpenProfile={
          handleOpenProfile
        }
        onSendMessage={
          handleSendMessage
        }
        onTypingStart={
          sendTypingStart
        }
        onTypingStop={
          sendTypingStop
        }
        markMessageAsRead={
          markMessageAsRead
        }
        onDeleteMessage={
          deleteMessageRealtime
        }
        onEditMessage={
          handleEditMessage
        }
        onReactionMessage={
          handleReactionMessage
        }
        isTyping={
          isTyping
        }
        typingUserName={
          typingUserName
        }
        replyingTo={
          replyingTo
        }
        onReplyMessage={
          handleReplyMessage
        }
        onCancelReply={
          handleCancelReply
        }
        isSending={
          isSending
        }
      />

      {/* =================================================
          PROFILE MODAL
      ================================================= */}

      <ProfileModal
        user={
          profileUser
        }
        isOwnProfile={
          isOwnProfile
        }
        isOpen={
          isProfileOpen
        }
        onClose={
          handleCloseProfile
        }
        onEditProfile={
          handleStartEditProfile
        }
        onLogout={
          handleLogout
        }
        onBlock={
          handleBlockUser
        }
        onUnblock={
          handleUnblockUser
        }
        isBlocked={
          blockStatus?.isBlocked ??
          false
        }
        isBlockLoading={
          isBlockLoading
        }
        isUploadingAvatar={
          isUploadingAvatar
        }
        onAvatarChange={
          isOwnProfile
            ? handleAvatarChange
            : undefined
        }

        // ==========================================
        // PROFILE EDIT
        // ==========================================

        isEditing={
          isEditingProfile
        }

        editName={
          editName
        }

        editBio={
          editBio
        }

        onEditNameChange={
          setEditName
        }

        onEditBioChange={
          setEditBio
        }

        onSaveProfile={
          handleSaveProfile
        }

        onCancelEdit={
          handleCancelEditProfile
        }

        isUpdatingProfile={
          isUpdatingProfile
        }
      />
    </div>
  );
}