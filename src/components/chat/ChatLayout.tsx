"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";
import ProfileModal from "../ProfileModal/ProfileModal";

import type {
  MessageSendPayload,
} from "./MessageComposer";

import {
  useAppDispatch,
  useAppSelector,
} from "@/src/redux/hooks";

import {
  conversationApi,
  useGetConversationsQuery,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useSendMessageMutation,
} from "@/src/redux/features/message/messageApi";

import {
  authApi,
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

import type {
  Message,
} from "@/src/redux/features/message/message.types";

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

 

  const [
    isBlocked,
    setIsBlocked,
  ] = useState(false);

  const [
    blockedByMe,
    setBlockedByMe,
  ] = useState(false);

  const [
    blockedByOther,
    setBlockedByOther,
  ] = useState(false);

  const [
    canUnblock,
    setCanUnblock,
  ] = useState(false);

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
  // SEND MESSAGE
  // =====================================================

  const [
    sendMessage,
    {
      isLoading: isSending,
    },
  ] = useSendMessageMutation();

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
  // CURRENT OTHER USER IN DIRECT CHAT
  // =====================================================

  const selectedDirectOtherUser =
    selectedConversation?.type ===
    "direct"
      ? selectedConversation.participants.find(
          (participant) =>
            String(participant._id) !==
            String(user?._id),
        )
      : null;

  const selectedDirectOtherUserId =
    selectedDirectOtherUser?._id
      ? String(
          selectedDirectOtherUser._id,
        )
      : null;

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

  const handleTypingStart =
    useCallback(
      (userId: string) => {
        setTypingUserId(userId);
      },
      [],
    );

  // =====================================================
  // TYPING STOP
  // =====================================================

  const handleTypingStop =
    useCallback(
      (userId: string) => {
        setTypingUserId(
          (currentUserId) => {
            if (
              String(currentUserId) ===
              String(userId)
            ) {
              return null;
            }

            return currentUserId;
          },
        );
      },
      [],
    );

  // =====================================================
  // REALTIME USER BLOCKED
  // =====================================================

  const handleUserBlocked =
    useCallback(
      ({
        blockerId,
        blockedId,
      }: {
        blockerId: string;
        blockedId: string;
      }) => {
        const normalizedBlockerId =
          String(blockerId);

        const normalizedBlockedId =
          String(blockedId);

        const normalizedCurrentUserId =
          user?._id
            ? String(user._id)
            : null;

        if (
          !normalizedCurrentUserId
        ) {
          return;
        }

        // ==========================================
        // EVENT MUST BELONG TO CURRENT USER
        // ==========================================

        if (
          normalizedBlockedId !==
          normalizedCurrentUserId
        ) {
          return;
        }

        // ==========================================
        // UPDATE CURRENT PROFILE STATE
        //
        // Example:
        //
        // A blocks B
        //
        // B's profileUserId = A
        //
        // B sees:
        // blockedByOther = true
        // canUnblock = false
        // ==========================================

        const isCurrentProfileTarget =
          profileUserId &&
          String(profileUserId) ===
            normalizedBlockerId;

        // ==========================================
        // UPDATE CURRENT DIRECT CHAT STATE
        //
        // Example:
        //
        // A blocks B
        //
        // B is currently chatting with A.
        //
        // ChatUI must immediately become blocked.
        // ==========================================

        const isCurrentDirectChatTarget =
          selectedDirectOtherUserId &&
          String(
            selectedDirectOtherUserId,
          ) === normalizedBlockerId;

        if (
          !isCurrentProfileTarget &&
          !isCurrentDirectChatTarget
        ) {
          return;
        }

        console.log(
          "REALTIME BLOCK UI UPDATE:",
          {
            blockerId:
              normalizedBlockerId,
            blockedId:
              normalizedBlockedId,
          },
        );

        // ==========================================
        // CURRENT USER WAS BLOCKED BY OTHER USER
        // ==========================================

        setIsBlocked(true);

        setBlockedByMe(false);

        setBlockedByOther(true);

        setCanUnblock(false);

        // ==========================================
        // CANCEL REPLY
        // ==========================================

        setReplyingTo(null);

        // ==========================================
        // STOP TYPING
        // ==========================================

        setTypingUserId(null);

        // ==========================================
        // INVALIDATE PROFILE/BLOCK CACHE
        //
        // This will refresh API state as well.
        // ==========================================

        dispatch(
          authApi.util.invalidateTags([
            {
              type: "Block",
              id: normalizedBlockerId,
            },
            {
              type: "User",
              id: normalizedBlockerId,
            },
          ]),
        );
      },
      [
        user?._id,
        profileUserId,
        selectedDirectOtherUserId,
        dispatch,
      ],
    );

  // =====================================================
  // REALTIME USER UNBLOCKED
  // =====================================================

  const handleUserUnblocked =
    useCallback(
      ({
        blockerId,
        blockedId,
      }: {
        blockerId: string;
        blockedId: string;
      }) => {
        const normalizedBlockerId =
          String(blockerId);

        const normalizedBlockedId =
          String(blockedId);

        const normalizedCurrentUserId =
          user?._id
            ? String(user._id)
            : null;

        if (
          !normalizedCurrentUserId
        ) {
          return;
        }

        // ==========================================
        // EVENT MUST BELONG TO CURRENT USER
        // ==========================================

        if (
          normalizedBlockedId !==
          normalizedCurrentUserId
        ) {
          return;
        }

        // ==========================================
        // CHECK CURRENT PROFILE
        // ==========================================

        const isCurrentProfileTarget =
          profileUserId &&
          String(profileUserId) ===
            normalizedBlockerId;

        // ==========================================
        // CHECK CURRENT DIRECT CHAT
        // ==========================================

        const isCurrentDirectChatTarget =
          selectedDirectOtherUserId &&
          String(
            selectedDirectOtherUserId,
          ) === normalizedBlockerId;

        if (
          !isCurrentProfileTarget &&
          !isCurrentDirectChatTarget
        ) {
          return;
        }

        console.log(
          "REALTIME UNBLOCK UI UPDATE:",
          {
            blockerId:
              normalizedBlockerId,
            blockedId:
              normalizedBlockedId,
          },
        );

        // ==========================================
        // REMOVE BLOCKED STATE
        // ==========================================

        setIsBlocked(false);

        setBlockedByMe(false);

        setBlockedByOther(false);

        setCanUnblock(false);

        // ==========================================
        // INVALIDATE CACHE
        // ==========================================

        dispatch(
          authApi.util.invalidateTags([
            {
              type: "Block",
              id: normalizedBlockerId,
            },
            {
              type: "User",
              id: normalizedBlockerId,
            },
          ]),
        );
      },
      [
        user?._id,
        profileUserId,
        selectedDirectOtherUserId,
        dispatch,
      ],
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

    // ==========================================
    // REALTIME BLOCK EVENTS
    // ==========================================

    onUserBlocked:
      handleUserBlocked,

    onUserUnblocked:
      handleUserUnblocked,
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
  // BLOCK STATUS API
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
  // SYNC BLOCK STATUS
  // =====================================================

  useEffect(() => {
    if (!profileUserId) {
      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

      return;
    }

    // ==========================================
    // OWN PROFILE
    // ==========================================

    if (
      String(profileUserId) ===
      String(user?._id)
    ) {
      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

      return;
    }

    if (!blockStatus) {
      return;
    }

    setIsBlocked(
      blockStatus.isBlocked === true,
    );

    setBlockedByMe(
      blockStatus.blockedByMe === true,
    );

    setBlockedByOther(
      blockStatus.blockedByOther === true,
    );

    setCanUnblock(
      blockStatus.canUnblock === true,
    );
  }, [
    blockStatus,
    profileUserId,
    user?._id,
  ]);

  // =====================================================
  // BLOCK USER MUTATION
  // =====================================================

  const [
    blockUser,
    {
      isLoading: isBlocking,
    },
  ] = useBlockUserMutation();

  // =====================================================
  // UNBLOCK USER MUTATION
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

  const handleSendMessage =
    async (
      payload: MessageSendPayload,
    ) => {
      try {
        if (
          !selectedConversationId
        ) {
          return;
        }

        // ==========================================
        // BLOCKED RELATIONSHIP
        // ==========================================

        if (isBlocked) {
          console.warn(
            "Cannot send message. User is blocked.",
          );

          return;
        }

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

        // ==========================================
        // CLEAR REPLY MODE
        // ==========================================

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

  const handleSelectConversation =
    (
      conversationId: string,
    ) => {
      setTypingUserId(null);

      setReplyingTo(null);

      setIsProfileOpen(false);

      setProfileUserId(null);

      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

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
                  String(
                    item._id,
                  ) ===
                  String(
                    conversationId,
                  ),
              );

            if (!conversation) {
              return;
            }

            conversation.unreadCount =
              0;
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

  const handleReplyMessage =
    (message: Message) => {
      if (isBlocked) {
        return;
      }

      setReplyingTo(message);
    };

  // =====================================================
  // CANCEL REPLY
  // =====================================================

  const handleCancelReply =
    () => {
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

    if (isBlocked) {
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

    if (isBlocked) {
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

  const handleOpenSidebar =
    () => {
      setIsSidebarOpen(true);
    };

  // =====================================================
  // CLOSE SIDEBAR
  // =====================================================

  const handleCloseSidebar =
    () => {
      setIsSidebarOpen(false);
    };

  // =====================================================
  // OPEN OTHER USER PROFILE
  // =====================================================

  const handleOpenProfile =
    () => {
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
            String(
              participant._id,
            ) !==
            String(user?._id),
        );

      if (!otherUser) {
        return;
      }

      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");

      // ==========================================
      // RESET OLD BLOCK STATE
      // ==========================================

      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

      setProfileUserId(
        String(otherUser._id),
      );

      setIsProfileOpen(true);
    };

  // =====================================================
  // OPEN OWN PROFILE
  // =====================================================

  const handleOpenOwnProfile =
    () => {
      if (!user?._id) {
        return;
      }

      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");

      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

      setProfileUserId(
        String(user._id),
      );

      setIsProfileOpen(true);
    };

  // =====================================================
  // CLOSE PROFILE
  // =====================================================

  const handleCloseProfile =
    () => {
      setIsProfileOpen(false);

      setProfileUserId(null);

      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");
    };

  // =====================================================
  // START EDIT PROFILE
  // =====================================================

  const handleStartEditProfile =
    () => {
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

  const handleCancelEditProfile =
    () => {
      setIsEditingProfile(false);

      setEditName("");

      setEditBio("");
    };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile =
    async () => {
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
          updateUser(
            updatedUser,
          ),
        );

        // ==========================================
        // EXIT EDIT MODE
        // ==========================================

        setIsEditingProfile(
          false,
        );

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

  const handleAvatarChange =
    async (
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
          updateUser(
            updatedUser,
          ),
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

  const handleBlockUser =
    async () => {
      if (!profileUserId) {
        return;
      }

      if (
        String(profileUserId) ===
        String(user?._id)
      ) {
        return;
      }

      const targetUserId =
        String(profileUserId);

      try {
        await blockUser(
          targetUserId,
        ).unwrap();

        // ==========================================
        // IMMEDIATE UI UPDATE
        //
        // Current user is the blocker.
        // ==========================================

        setIsBlocked(true);

        setBlockedByMe(true);

        setBlockedByOther(false);

        setCanUnblock(true);

        // ==========================================
        // CANCEL REPLY
        // ==========================================

        setReplyingTo(null);

        setTypingUserId(null);

        // ==========================================
        // INVALIDATE BLOCK CACHE
        // ==========================================

        dispatch(
          authApi.util.invalidateTags([
            {
              type: "Block",
              id: targetUserId,
            },
            {
              type: "User",
              id: targetUserId,
            },
          ]),
        );
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

  const handleUnblockUser =
    async () => {
      if (!profileUserId) {
        return;
      }

      if (
        String(profileUserId) ===
        String(user?._id)
      ) {
        return;
      }

      // ==========================================
      // ONLY BLOCKER CAN UNBLOCK
      // ==========================================

      if (!canUnblock) {
        console.warn(
          "Cannot unblock. Current user is not the blocker.",
        );

        return;
      }

      const targetUserId =
        String(profileUserId);

      try {
        await unblockUser(
          targetUserId,
        ).unwrap();

        // ==========================================
        // IMMEDIATE UI UPDATE
        // ==========================================

        setIsBlocked(false);

        setBlockedByMe(false);

        setBlockedByOther(false);

        setCanUnblock(false);

        // ==========================================
        // INVALIDATE BLOCK CACHE
        // ==========================================

        dispatch(
          authApi.util.invalidateTags([
            {
              type: "Block",
              id: targetUserId,
            },
            {
              type: "User",
              id: targetUserId,
            },
          ]),
        );
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

  const handleLogout =
    () => {
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

        setIsBlocked(false);
        setBlockedByMe(false);
        setBlockedByOther(false);
        setCanUnblock(false);

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
          authApi.util.resetApiState(),
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
      : fetchedProfileUser ??
        null;

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
        isBlocked={
          isBlocked
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
          isBlocked
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

        // ==========================================
        // BLOCK PROPS
        // ==========================================

        blockedByMe={
          blockedByMe
        }

        blockedByOther={
          blockedByOther
        }

        canUnblock={
          canUnblock
        }
      />
    </div>
  );
}