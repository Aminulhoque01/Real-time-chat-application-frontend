


"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";
import ProfileModal from "../ProfileModal/ProfileModal";

import type { MessageSendPayload } from "./MessageComposer";
import type { Message } from "@/src/redux/features/message/message.types";

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

import useChatSocket from "@/src/hooks/useChatSocket";
import { usePushNotification } from "@/src/hooks/usePushNotification";

type CallType = "audio" | "video";

export default function ChatLayout() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // =====================================================
  // AUTH + PUSH NOTIFICATION
  // =====================================================

  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const currentUserId = user?._id
    ? String(user._id)
    : null;

  usePushNotification({
    userId: currentUserId ?? undefined,
  });

  // =====================================================
  // CONVERSATIONS
  // =====================================================

  const { data: conversations = [] } =
    useGetConversationsQuery();

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] =
    useState<Message | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(true);

  const [typingUserId, setTypingUserId] =
    useState<string | null>(null);

  // =====================================================
  // PROFILE STATE
  // =====================================================

  const [isProfileOpen, setIsProfileOpen] =
    useState(false);

  const [profileUserId, setProfileUserId] =
    useState<string | null>(null);

  // Profile modal block state
  const [isBlocked, setIsBlocked] =
    useState(false);

  const [blockedByMe, setBlockedByMe] =
    useState(false);

  const [blockedByOther, setBlockedByOther] =
    useState(false);

  const [canUnblock, setCanUnblock] =
    useState(false);

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [editName, setEditName] =
    useState("");

  const [editBio, setEditBio] =
    useState("");

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const [sendMessage, { isLoading: isSending }] =
    useSendMessageMutation();

  // =====================================================
  // SELECTED CONVERSATION
  // =====================================================

  const selectedConversation =
    conversations.find(
      (conversation) =>
        String(conversation._id) ===
        String(selectedConversationId),
    ) ?? null;

  const selectedDirectOtherUser =
    selectedConversation?.type === "direct"
      ? selectedConversation.participants.find(
          (participant) =>
            String(participant._id) !==
            String(currentUserId),
        ) ?? null
      : null;

  const selectedDirectOtherUserId =
    selectedDirectOtherUser?._id
      ? String(selectedDirectOtherUser._id)
      : null;

  // =====================================================
  // SELECTED CHAT BLOCK STATUS
  // =====================================================
  // Important:
  // The selected chat's block status must not depend on
  // whether the profile modal has been opened.

  const {
    data: selectedChatBlockStatus,
    isLoading: isSelectedChatBlockStatusLoading,
  } = useGetBlockStatusQuery(
    selectedDirectOtherUserId as string,
    {
      skip: !selectedDirectOtherUserId,
    },
  );

  const isCurrentChatBlocked =
    Boolean(selectedDirectOtherUserId) &&
    (
      isSelectedChatBlockStatusLoading ||
      selectedChatBlockStatus?.isBlocked === true
    );

  // =====================================================
  // TYPING USER
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
  // INITIAL STATE
  // =====================================================

  useEffect(() => {
    if (currentUserId) {
      setIsSidebarOpen(true);
    }
  }, [currentUserId]);

  // =====================================================
  // TYPING EVENTS
  // =====================================================

  const handleTypingStart = useCallback(
    (userId: string) => {
      setTypingUserId(userId);
    },
    [],
  );

  const handleTypingStop = useCallback(
    (userId: string) => {
      setTypingUserId((currentUserId) => {
        if (
          String(currentUserId) === String(userId)
        ) {
          return null;
        }

        return currentUserId;
      });
    },
    [],
  );

  // =====================================================
  // REALTIME BLOCK EVENT
  // =====================================================

  const handleUserBlocked = useCallback(
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

      if (
        !currentUserId ||
        normalizedBlockedId !== currentUserId
      ) {
        return;
      }

      const isCurrentProfileTarget =
        Boolean(profileUserId) &&
        String(profileUserId) ===
          normalizedBlockerId;

      const isCurrentDirectChatTarget =
        Boolean(selectedDirectOtherUserId) &&
        selectedDirectOtherUserId ===
          normalizedBlockerId;

      if (
        !isCurrentProfileTarget &&
        !isCurrentDirectChatTarget
      ) {
        return;
      }

      // The other user blocked the current user.
      if (isCurrentProfileTarget) {
        setIsBlocked(true);
        setBlockedByMe(false);
        setBlockedByOther(true);
        setCanUnblock(false);
      }

      setReplyingTo(null);
      setTypingUserId(null);

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
      currentUserId,
      profileUserId,
      selectedDirectOtherUserId,
      dispatch,
    ],
  );

  // =====================================================
  // REALTIME UNBLOCK EVENT
  // =====================================================

  const handleUserUnblocked = useCallback(
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

      if (
        !currentUserId ||
        normalizedBlockedId !== currentUserId
      ) {
        return;
      }

      const isCurrentProfileTarget =
        Boolean(profileUserId) &&
        String(profileUserId) ===
          normalizedBlockerId;

      const isCurrentDirectChatTarget =
        Boolean(selectedDirectOtherUserId) &&
        selectedDirectOtherUserId ===
          normalizedBlockerId;

      if (
        !isCurrentProfileTarget &&
        !isCurrentDirectChatTarget
      ) {
        return;
      }

      if (isCurrentProfileTarget) {
        setIsBlocked(false);
        setBlockedByMe(false);
        setBlockedByOther(false);
        setCanUnblock(false);
      }

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
      currentUserId,
      profileUserId,
      selectedDirectOtherUserId,
      dispatch,
    ],
  );

  // =====================================================
  // SOCKET + WEBRTC
  // =====================================================

  const {
    // Existing chat actions
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    deleteMessageRealtime,
    editMessageRealtime,
    toggleMessageReactionRealtime,
    disconnectSocket,

    // WebRTC state
    callStatus,
    incomingCall,
    activeCallId,
    callType,
    localStream,
    remoteStream,
    callError,
    isMicrophoneEnabled,
    isCameraEnabled,

    // WebRTC actions
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
  } = useChatSocket({
    conversationId: selectedConversationId,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onUserBlocked: handleUserBlocked,
    onUserUnblocked: handleUserUnblocked,
  });

  // =====================================================
  // START AUDIO / VIDEO CALL
  // =====================================================

  const handleStartCall = useCallback(
    async (
      receiverId: string,
      type: CallType,
    ): Promise<boolean> => {
      if (
        !receiverId ||
        !currentUserId ||
        receiverId === currentUserId
      ) {
        return false;
      }

      if (isCurrentChatBlocked) {
        console.warn(
          "Cannot call a blocked user.",
        );
        return false;
      }

      if (
        callStatus !== "idle" &&
        callStatus !== "ended"
      ) {
        console.warn(
          "A call is already in progress.",
        );
        return false;
      }

      try {
        return await startCall(receiverId, type);
      } catch (error) {
        console.error(
          "Failed to start call:",
          error,
        );

        return false;
      }
    },
    [
      currentUserId,
      isCurrentChatBlocked,
      callStatus,
      startCall,
    ],
  );

  const handleStartAudioCall = useCallback(
    () => {
      if (!selectedDirectOtherUserId) {
        return;
      }

      void handleStartCall(
        selectedDirectOtherUserId,
        "audio",
      );
    },
    [
      selectedDirectOtherUserId,
      handleStartCall,
    ],
  );

  const handleStartVideoCall = useCallback(
    () => {
      if (!selectedDirectOtherUserId) {
        return;
      }

      void handleStartCall(
        selectedDirectOtherUserId,
        "video",
      );
    },
    [
      selectedDirectOtherUserId,
      handleStartCall,
    ],
  );

  const isCallDisabled =
    !selectedDirectOtherUserId ||
    isCurrentChatBlocked ||
    (
      callStatus !== "idle" &&
      callStatus !== "ended"
    );

  // =====================================================
  // PROFILE API
  // =====================================================

  const isOwnProfile =
    Boolean(profileUserId) &&
    String(profileUserId) ===
      String(currentUserId);

  const {
    data: fetchedProfileUser,
  } = useGetUserProfileQuery(
    profileUserId as string,
    {
      skip:
        !profileUserId ||
        isOwnProfile,
    },
  );

  const {
    data: blockStatus,
    isLoading: isBlockStatusLoading,
  } = useGetBlockStatusQuery(
    profileUserId as string,
    {
      skip:
        !profileUserId ||
        isOwnProfile,
    },
  );

  // =====================================================
  // SYNC PROFILE BLOCK STATUS
  // =====================================================

  useEffect(() => {
    if (!profileUserId || isOwnProfile) {
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
    isOwnProfile,
  ]);

  // =====================================================
  // MUTATIONS
  // =====================================================

  const [
    blockUser,
    { isLoading: isBlocking },
  ] = useBlockUserMutation();

  const [
    unblockUser,
    { isLoading: isUnblocking },
  ] = useUnblockUserMutation();

  const [
    updateMyAvatar,
    { isLoading: isUploadingAvatar },
  ] = useUpdateMyAvatarMutation();

  const [
    updateMyProfile,
    { isLoading: isUpdatingProfile },
  ] = useUpdateMyProfileMutation();

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  const handleSendMessage = async (
    payload: MessageSendPayload,
  ) => {
    if (
      !selectedConversationId ||
      isCurrentChatBlocked
    ) {
      return;
    }

    try {
      const messagePayload = {
        ...payload,
        conversationId: selectedConversationId,
        ...(replyingTo?._id
          ? {
              replyTo: replyingTo._id,
            }
          : {}),
      };

      await sendMessage(
        messagePayload,
      ).unwrap();

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

    setIsBlocked(false);
    setBlockedByMe(false);
    setBlockedByOther(false);
    setCanUnblock(false);

    setIsEditingProfile(false);
    setEditName("");
    setEditBio("");

    dispatch(
      conversationApi.util.updateQueryData(
        "getConversations",
        undefined,
        (draft) => {
          const conversation = draft.find(
            (item) =>
              String(item._id) ===
              String(conversationId),
          );

          if (conversation) {
            conversation.unreadCount = 0;
          }
        },
      ),
    );

    setSelectedConversationId(
      conversationId,
    );

    setIsSidebarOpen(false);
  };

  // =====================================================
  // MESSAGE ACTIONS
  // =====================================================

  const handleReplyMessage = (
    message: Message,
  ) => {
    if (!isCurrentChatBlocked) {
      setReplyingTo(message);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleEditMessage = (
    messageId: string,
    text: string,
  ): boolean => {
    if (
      !messageId ||
      !text.trim() ||
      isCurrentChatBlocked
    ) {
      return false;
    }

    return editMessageRealtime(
      messageId,
      text,
    );
  };

  const handleReactionMessage = (
    messageId: string,
    emoji: string,
  ): boolean => {
    if (
      !messageId ||
      !emoji ||
      isCurrentChatBlocked
    ) {
      return false;
    }

    return toggleMessageReactionRealtime(
      messageId,
      emoji,
    );
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  const handleOpenSidebar = useCallback(
    () => {
      setIsSidebarOpen(true);
    },
    [],
  );

  const handleCloseSidebar = useCallback(
    () => {
      setIsSidebarOpen(false);
    },
    [],
  );

  // =====================================================
  // OPEN OTHER USER PROFILE
  // =====================================================

  const handleOpenProfile = () => {
    if (
      !selectedConversation ||
      selectedConversation.type !== "direct"
    ) {
      return;
    }

    const otherUser =
      selectedConversation.participants.find(
        (participant) =>
          String(participant._id) !==
          String(currentUserId),
      );

    if (!otherUser?._id) {
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
      String(otherUser._id),
    );

    setIsProfileOpen(true);
  };

  // =====================================================
  // OPEN OWN PROFILE
  // =====================================================

  const handleOpenOwnProfile = () => {
    if (!currentUserId) {
      return;
    }

    setIsEditingProfile(false);
    setEditName("");
    setEditBio("");

    setIsBlocked(false);
    setBlockedByMe(false);
    setBlockedByOther(false);
    setCanUnblock(false);

    setProfileUserId(currentUserId);
    setIsProfileOpen(true);
  };

  // =====================================================
  // CLOSE PROFILE
  // =====================================================

  const handleCloseProfile = () => {
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
  // EDIT PROFILE
  // =====================================================

  const handleStartEditProfile = () => {
    if (!user) {
      return;
    }

    setEditName(user.name ?? "");
    setEditBio(user.bio ?? "");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditName("");
    setEditBio("");
  };

  const handleSaveProfile = async () => {
    if (!currentUserId) {
      return;
    }

    const name = editName.trim();
    const bio = editBio.trim();

    if (!name) {
      return;
    }

    try {
      const updatedUser =
        await updateMyProfile({
          name,
          bio,
        }).unwrap();

      dispatch(updateUser(updatedUser));

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
    if (!currentUserId) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append(
        "avatar",
        file,
      );

      const updatedUser =
        await updateMyAvatar(
          formData,
        ).unwrap();

      dispatch(updateUser(updatedUser));
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
    if (
      !profileUserId ||
      String(profileUserId) ===
        String(currentUserId)
    ) {
      return;
    }

    const targetUserId =
      String(profileUserId);

    try {
      await blockUser(
        targetUserId,
      ).unwrap();

      setIsBlocked(true);
      setBlockedByMe(true);
      setBlockedByOther(false);
      setCanUnblock(true);

      setReplyingTo(null);
      setTypingUserId(null);

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

  const handleUnblockUser = async () => {
    if (
      !profileUserId ||
      String(profileUserId) ===
        String(currentUserId) ||
      !canUnblock
    ) {
      return;
    }

    const targetUserId =
      String(profileUserId);

    try {
      await unblockUser(
        targetUserId,
      ).unwrap();

      setIsBlocked(false);
      setBlockedByMe(false);
      setBlockedByOther(false);
      setCanUnblock(false);

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

  const handleLogout = async () => {
    try {
      // End the call before disconnecting the socket.
      await Promise.resolve(endCall());
    } catch (error) {
      console.error(
        "Call cleanup failed:",
        error,
      );
    }

    try {
      disconnectSocket();
    } catch (error) {
      console.error(
        "Socket disconnect failed:",
        error,
      );
    }

    setIsProfileOpen(false);
    setProfileUserId(null);
    setReplyingTo(null);
    setSelectedConversationId(null);

    setIsBlocked(false);
    setBlockedByMe(false);
    setBlockedByOther(false);
    setCanUnblock(false);

    setIsEditingProfile(false);
    setEditName("");
    setEditBio("");
    setIsSidebarOpen(false);
    setTypingUserId(null);

    dispatch(logout());
    dispatch(authApi.util.resetApiState());

    router.replace("/login");
  };

  // =====================================================
  // DERIVED STATE
  // =====================================================

  const isTyping =
    typingUserId !== null &&
    String(typingUserId) !==
      String(currentUserId);

  const profileUser = isOwnProfile
    ? user
    : fetchedProfileUser ?? null;

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
        relative flex h-screen min-h-0
        overflow-hidden bg-slate-50
      "
    >
      <ChatSidebar
        selectedConversationId={
          selectedConversationId
        }
        onSelectConversation={
          handleSelectConversation
        }
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onOpenProfile={handleOpenOwnProfile}
      />

      {/* MOBILE SIDEBAR OVERLAY */}

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={handleCloseSidebar}
          className="
            absolute inset-0 z-30
            bg-black/20 lg:hidden
          "
        />
      )}

      {/* MOBILE MENU BUTTON */}

      {!isSidebarOpen && (
        <button
          type="button"
          onClick={handleOpenSidebar}
          aria-label="Open conversations"
          title="Open conversations"
          className="
            fixed left-3 top-3 z-[60]
            flex h-11 w-11 items-center
            justify-center rounded-xl
            border border-slate-200
            bg-white text-slate-700 shadow-lg
            transition
            hover:bg-slate-50 hover:text-slate-900
            active:scale-95 lg:hidden
          "
        >
          <Menu
            size={21}
            strokeWidth={2}
          />
        </button>
      )}

      {/* CHAT UI */}

      <ChatUI
        // Existing chat props
        conversation={selectedConversation}
        currentUserId={user?._id}
        onOpenSidebar={handleOpenSidebar}
        onOpenProfile={handleOpenProfile}
        onSendMessage={handleSendMessage}
        onTypingStart={sendTypingStart}
        onTypingStop={sendTypingStop}
        markMessageAsRead={markMessageAsRead}
        onDeleteMessage={deleteMessageRealtime}
        onEditMessage={handleEditMessage}
        onReactionMessage={handleReactionMessage}
        isTyping={isTyping}
        typingUserName={typingUserName}
        replyingTo={replyingTo}
        onReplyMessage={handleReplyMessage}
        onCancelReply={handleCancelReply}
        isSending={isSending}
        isBlocked={isCurrentChatBlocked}

        // WebRTC state
        callStatus={callStatus}
        incomingCall={incomingCall}
        activeCallId={activeCallId}
        callType={callType}
        localStream={localStream}
        remoteStream={remoteStream}
        callError={callError}
        isMicrophoneEnabled={
          isMicrophoneEnabled
        }
        isCameraEnabled={isCameraEnabled}

        // WebRTC actions
        onStartCall={handleStartCall}
        onAcceptCall={acceptCall}
        onRejectCall={rejectCall}
        onCancelCall={cancelCall}
        onEndCall={endCall}
        onToggleMicrophone={toggleMicrophone}
        onToggleCamera={toggleCamera}

        // ChatHeader call buttons
       
       
        isCallDisabled={isCallDisabled}
      />

      {/* PROFILE MODAL */}

      <ProfileModal
        user={profileUser}
        isOwnProfile={isOwnProfile}
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        onEditProfile={
          handleStartEditProfile
        }
        onLogout={handleLogout}
        onBlock={handleBlockUser}
        onUnblock={handleUnblockUser}
        isBlocked={isBlocked}
        isBlockLoading={isBlockLoading}
        isUploadingAvatar={
          isUploadingAvatar
        }
        onAvatarChange={
          isOwnProfile
            ? handleAvatarChange
            : undefined
        }
        isEditing={isEditingProfile}
        editName={editName}
        editBio={editBio}
        onEditNameChange={setEditName}
        onEditBioChange={setEditBio}
        onSaveProfile={handleSaveProfile}
        onCancelEdit={handleCancelEditProfile}
        isUpdatingProfile={
          isUpdatingProfile
        }
        blockedByMe={blockedByMe}
        blockedByOther={blockedByOther}
        canUnblock={canUnblock}
      />
    </div>
  );
}
 