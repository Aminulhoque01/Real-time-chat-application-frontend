"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  X,
  Users,
  UserPlus,
  Crown,
  Pencil,
  Trash2,
  LogOut,
  Check,
  Loader2,
  Search,
  ShieldCheck,
  Camera,
} from "lucide-react";

import {
  useAddParticipantsMutation,
  useDeleteGroupMutation,
  useRemoveParticipantMutation,
  usePromoteAdminMutation,
  useRenameGroupMutation,
  useUpdateGroupPhotoMutation,
} from "@/src/redux/features/conversation/conversationApi";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

import { useGetAllUsersQuery } from "@/src/redux/features/auth/authApi";

import type { User } from "@/src/redux/features/auth/auth.types";

// ==================================================
// PROPS
// ==================================================

interface GroupModalProps {
  isOpen: boolean;

  onClose: () => void;

  currentUserId?: string;

  existingConversation: Conversation;

  onUpdated?: (
    conversation: Conversation,
  ) => void;

  onLeft?: () => void;

  onDeleted?: (
    conversationId: string,
  ) => void;
}

// ==================================================
// HELPERS
// ==================================================

const getConversationUserId = (
  user: ConversationUser,
): string => {
  return String(user._id);
};

const getConversationUserName = (
  user: ConversationUser,
): string => {
  return (
    user.name?.trim() ||
    user.phone ||
    "Unknown User"
  );
};

const getAuthUserName = (
  user: User,
): string => {
  return (
    user.name?.trim() ||
    user.phone ||
    "Unknown User"
  );
};

// ==================================================
// GROUP MODAL
// ==================================================

export default function GroupModal({
  isOpen,
  onClose,
  currentUserId,
  existingConversation,
  onUpdated,
  onLeft,
  onDeleted,
}: GroupModalProps) {
  // ==================================================
  // LOCAL STATE
  // ==================================================

  const [
    activeSection,
    setActiveSection,
  ] = useState<"members" | "add">(
    "members",
  );

  const [
    isRenameOpen,
    setIsRenameOpen,
  ] = useState(false);

  const [
    groupName,
    setGroupName,
  ] = useState(
    existingConversation.name || "",
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedUsers,
    setSelectedUsers,
  ] = useState<User[]>([]);

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    confirmDelete,
    setConfirmDelete,
  ] = useState(false);

  const [
    confirmLeave,
    setConfirmLeave,
  ] = useState(false);

  // ==================================================
  // API
  // ==================================================

  const [
    addParticipants,
    {
      isLoading:
        isAddingParticipants,
    },
  ] =
    useAddParticipantsMutation();

  const [
    removeParticipant,
    {
      isLoading:
        isRemovingParticipant,
    },
  ] =
    useRemoveParticipantMutation();

  const [
    promoteAdmin,
    {
      isLoading:
        isPromotingAdmin,
    },
  ] =
    usePromoteAdminMutation();

  const [
    renameGroup,
    {
      isLoading:
        isRenamingGroup,
    },
  ] =
    useRenameGroupMutation();

  const [
    updateGroupPhoto,
    {
      isLoading:
        isUploadingPhoto,
    },
  ] =
    useUpdateGroupPhotoMutation();

  const [
    deleteGroup,
    {
      isLoading:
        isDeletingGroup,
    },
  ] =
    useDeleteGroupMutation();

  // ==================================================
  // USERS
  // ==================================================

  const {
    data: usersData,
    isLoading: isUsersLoading,
  } = useGetAllUsersQuery(
    {
      page: 1,
      limit: 100,
    },
    {
      skip:
        !isOpen ||
        activeSection !== "add",
    },
  );

  // ==================================================
  // RESET STATE
  // ==================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setGroupName(
      existingConversation.name || "",
    );

    setSearchQuery("");

    setSelectedUsers([]);

    setActionError("");

    setConfirmDelete(false);

    setConfirmLeave(false);

    setActiveSection("members");

    setIsRenameOpen(false);
  }, [
    isOpen,
    existingConversation,
  ]);

  // ==================================================
  // ADMIN CHECK
  // ==================================================

  const isAdmin = useMemo(() => {
    if (!currentUserId) {
      return false;
    }

    const admins =
      existingConversation.admins || [];

    return admins.some(
      (admin) =>
        String(
          typeof admin === "string"
            ? admin
            : admin._id,
        ) ===
        String(currentUserId),
    );
  }, [
    currentUserId,
    existingConversation.admins,
  ]);

  // ==================================================
  // CURRENT USER
  // ==================================================

  const isCurrentUser = (
    user: ConversationUser,
  ) => {
    return (
      String(user._id) ===
      String(currentUserId)
    );
  };

  // ==================================================
  // ADMIN CHECK FOR USER
  // ==================================================

  const isUserAdmin = (
    userId: string,
  ) => {
    const admins =
      existingConversation.admins || [];

    return admins.some(
      (admin) =>
        String(
          typeof admin === "string"
            ? admin
            : admin._id,
        ) === String(userId),
    );
  };

  // ==================================================
  // ALL USERS
  // ==================================================

  const allUsers: User[] =
    usersData?.users || [];

  // ==================================================
  // AVAILABLE USERS
  // ==================================================

  const availableUsers =
    allUsers.filter((user) => {
      const alreadyMember =
        existingConversation.participants.some(
          (participant) =>
            String(
              participant._id,
            ) ===
            String(user._id),
        );

      const currentUser =
        String(user._id) ===
        String(currentUserId);

      return (
        !alreadyMember &&
        !currentUser
      );
    });

  // ==================================================
  // FILTER USERS
  // ==================================================

  const filteredUsers =
    availableUsers.filter((user) => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        user.name
          ?.toLowerCase()
          .includes(query) ||
        user.phone
          ?.toLowerCase()
          .includes(query)
      );
    });

  // ==================================================
  // SELECT USER
  // ==================================================

  const toggleUser = (
    user: User,
  ) => {
    setSelectedUsers((previous) => {
      const exists =
        previous.some(
          (item) =>
            String(item._id) ===
            String(user._id),
        );

      if (exists) {
        return previous.filter(
          (item) =>
            String(item._id) !==
            String(user._id),
        );
      }

      return [
        ...previous,
        user,
      ];
    });
  };

  // ==================================================
  // ADD PARTICIPANTS
  // ==================================================

  const handleAddParticipants =
    async () => {
      if (
        !selectedUsers.length
      ) {
        return;
      }

      setActionError("");

      try {
        const updated =
          await addParticipants({
            conversationId:
              existingConversation._id,

            participantIds:
              selectedUsers.map(
                (user) =>
                  String(user._id),
              ),
          }).unwrap();

        setSelectedUsers([]);

        setSearchQuery("");

        setActiveSection(
          "members",
        );

        onUpdated?.(updated);
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to add participants.",
        );
      }
    };

  // ==================================================
  // REMOVE PARTICIPANT
  // ==================================================

  const handleRemoveParticipant =
    async (
      user: ConversationUser,
    ) => {
      if (!isAdmin) {
        return;
      }

      if (
        isCurrentUser(user)
      ) {
        return;
      }

      if (
        isUserAdmin(
          String(user._id),
        )
      ) {
        setActionError(
          "Remove other admins before removing them.",
        );

        return;
      }

      setActionError("");

      try {
        const updated =
          await removeParticipant({
            conversationId:
              existingConversation._id,

            userId:
              String(user._id),
          }).unwrap();

        onUpdated?.(updated);
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to remove participant.",
        );
      }
    };

  // ==================================================
  // PROMOTE ADMIN
  // ==================================================

  const handlePromoteAdmin =
    async (
      user: ConversationUser,
    ) => {
      if (!isAdmin) {
        return;
      }

      if (
        isUserAdmin(
          String(user._id),
        )
      ) {
        return;
      }

      setActionError("");

      try {
        const updated =
          await promoteAdmin({
            conversationId:
              existingConversation._id,

            userId:
              String(user._id),
          }).unwrap();

        onUpdated?.(updated);
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to promote admin.",
        );
      }
    };

  // ==================================================
  // RENAME GROUP
  // ==================================================

  const handleRenameGroup =
    async () => {
      if (!isAdmin) {
        return;
      }

      const name =
        groupName.trim();

      if (!name) {
        setActionError(
          "Group name is required.",
        );

        return;
      }

      setActionError("");

      try {
        const updated =
          await renameGroup({
            conversationId:
              existingConversation._id,

            name,
          }).unwrap();

        setIsRenameOpen(false);

        onUpdated?.(updated);
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to rename group.",
        );
      }
    };

  // ==================================================
  // GROUP PHOTO
  // ==================================================

  const handleGroupPhotoChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!isAdmin) {
      return;
    }

    const file =
      event.target.files?.[0];

    // Reset input so same file can
    // be selected again later.
    event.target.value = "";

    if (!file) {
      return;
    }

    // ==================================================
    // VALIDATE TYPE
    // ==================================================

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setActionError(
        "Please select a valid image file.",
      );

      return;
    }

    // ==================================================
    // VALIDATE SIZE
    // ==================================================

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setActionError(
        "Image size must be less than 5MB.",
      );

      return;
    }

    setActionError("");

    try {
      const updated =
        await updateGroupPhoto({
          conversationId:
            existingConversation._id,

          photo: file,
        }).unwrap();

      onUpdated?.(updated);
    } catch (error: any) {
      setActionError(
        error?.data?.message ||
          "Failed to upload group photo.",
      );
    }
  };

  // ==================================================
  // LEAVE GROUP
  // ==================================================

  const handleLeaveGroup =
    async () => {
      if (!currentUserId) {
        return;
      }

      setActionError("");

      try {
        await removeParticipant({
          conversationId:
            existingConversation._id,

          userId:
            String(currentUserId),
        }).unwrap();

        setConfirmLeave(false);

        onLeft?.();
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to leave group.",
        );
      }
    };

  // ==================================================
  // DELETE GROUP
  // ==================================================

  const handleDeleteGroup =
    async () => {
      if (!isAdmin) {
        return;
      }

      setActionError("");

      try {
        await deleteGroup(
          existingConversation._id,
        ).unwrap();

        setConfirmDelete(false);

        onDeleted?.(
          existingConversation._id,
        );

        onClose();
      } catch (error: any) {
        setActionError(
          error?.data?.message ||
            "Failed to delete group.",
        );
      }
    };

  // ==================================================
  // BUSY STATE
  // ==================================================

  const isBusy =
    isAddingParticipants ||
    isRemovingParticipant ||
    isPromotingAdmin ||
    isRenamingGroup ||
    isUploadingPhoto ||
    isDeletingGroup;

  // ==================================================
  // CLOSE
  // ==================================================

  const handleClose = () => {
    if (isBusy) {
      return;
    }

    onClose();
  };

  // ==================================================
  // MODAL
  // ==================================================

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-lg
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex shrink-0
            items-center justify-between
            border-b border-slate-100
            px-5 py-4
          "
        >
          <div className="flex min-w-0 items-center gap-3">

            {/* GROUP AVATAR */}

            <div
              className="
                relative
                h-12 w-12
                shrink-0
              "
            >
              {existingConversation.groupPhoto ? (
                <img
                  src={
                    existingConversation.groupPhoto
                  }
                  alt={
                    existingConversation.name ||
                    "Group"
                  }
                  className="
                    h-12 w-12
                    rounded-2xl
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex h-12 w-12
                    items-center justify-center
                    rounded-2xl
                    bg-slate-900
                    text-white
                  "
                >
                  <Users size={22} />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2
                className="
                  truncate
                  text-base font-bold
                  text-slate-900
                "
              >
                {existingConversation.name ||
                  "Group"}
              </h2>

              <p
                className="
                  text-xs
                  text-slate-400
                "
              >
                {
                  existingConversation
                    .participants.length
                }{" "}
                members
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Close group modal"
          >
            <X size={19} />
          </button>
        </div>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* ==================================================
              GROUP INFO
          ================================================== */}

          <div
            className="
              border-b border-slate-100
              px-5 py-5
            "
          >
            <div
              className="
                flex items-center
                justify-between
              "
            >
              <div className="min-w-0 flex-1">
                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                  "
                >
                  Group name
                </p>

                {isRenameOpen &&
                isAdmin ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={
                        groupName
                      }
                      onChange={(event) =>
                        setGroupName(
                          event.target
                            .value,
                        )
                      }
                      autoFocus
                      maxLength={100}
                      className="
                        min-w-0 flex-1
                        rounded-xl
                        border border-slate-200
                        bg-slate-50
                        px-3 py-2
                        text-sm
                        outline-none
                        focus:border-slate-400
                        focus:bg-white
                      "
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          handleRenameGroup();
                        }

                        if (
                          event.key ===
                          "Escape"
                        ) {
                          setIsRenameOpen(
                            false,
                          );

                          setGroupName(
                            existingConversation.name ||
                              "",
                          );
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={
                        handleRenameGroup
                      }
                      disabled={
                        isRenamingGroup
                      }
                      className="
                        flex h-9 w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-900
                        text-white
                        transition
                        hover:bg-slate-800
                        disabled:opacity-50
                      "
                    >
                      {isRenamingGroup ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Check
                          size={16}
                        />
                      )}
                    </button>
                  </div>
                ) : (
                  <p
                    className="
                      mt-1
                      truncate
                      text-sm font-semibold
                      text-slate-800
                    "
                  >
                    {existingConversation.name ||
                      "Group"}
                  </p>
                )}
              </div>

              {isAdmin &&
                !isRenameOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");

                      setGroupName(
                        existingConversation.name ||
                          "",
                      );

                      setIsRenameOpen(
                        true,
                      );
                    }}
                    className="
                      ml-3
                      flex h-9 w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-slate-700
                    "
                    title="Rename group"
                  >
                    <Pencil
                      size={16}
                    />
                  </button>
                )}
            </div>

            {/* ==================================================
                GROUP PHOTO
            ================================================== */}

            {isAdmin && (
              <label
                className="
                  relative
                  mt-4 flex w-full
                  cursor-pointer
                  items-center gap-3
                  rounded-2xl
                  border border-dashed
                  border-slate-200
                  bg-slate-50
                  px-4 py-3
                  text-left
                  transition
                  hover:border-slate-300
                  hover:bg-slate-100
                "
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={
                    handleGroupPhotoChange
                  }
                  disabled={
                    isUploadingPhoto ||
                    isDeletingGroup
                  }
                />

                <div
                  className="
                    flex h-10 w-10
                    shrink-0
                    items-center justify-center
                    overflow-hidden
                    rounded-xl
                    bg-white
                    text-slate-500
                  "
                >
                  {existingConversation.groupPhoto ? (
                    <img
                      src={
                        existingConversation.groupPhoto
                      }
                      alt="Group photo"
                      className="
                        h-full w-full
                        object-cover
                      "
                    />
                  ) : (
                    <Camera size={17} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="
                      text-sm font-semibold
                      text-slate-700
                    "
                  >
                    {isUploadingPhoto
                      ? "Uploading photo..."
                      : "Change group photo"}
                  </p>

                  <p
                    className="
                      text-[11px]
                      text-slate-400
                    "
                  >
                    JPG, PNG, WEBP · Max 5MB
                  </p>
                </div>

                {isUploadingPhoto ? (
                  <Loader2
                    size={18}
                    className="
                      shrink-0
                      animate-spin
                      text-slate-500
                    "
                  />
                ) : (
                  <Camera
                    size={17}
                    className="
                      shrink-0
                      text-slate-400
                    "
                  />
                )}
              </label>
            )}
          </div>

          {/* ==================================================
              TABS
          ================================================== */}

          <div
            className="
              flex
              border-b border-slate-100
              px-5
            "
          >
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  "members",
                )
              }
              className={`
                relative
                flex items-center gap-2
                px-2 py-3
                text-xs font-semibold
                transition
                ${
                  activeSection ===
                  "members"
                    ? "text-slate-900"
                    : "text-slate-400"
                }
              `}
            >
              <Users size={15} />

              Members

              {activeSection ===
                "members" && (
                <span
                  className="
                    absolute
                    bottom-0 left-0 right-0
                    h-0.5
                    rounded-full
                    bg-slate-900
                  "
                />
              )}
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActiveSection(
                    "add",
                  )
                }
                className={`
                  relative
                  ml-5
                  flex items-center gap-2
                  px-2 py-3
                  text-xs font-semibold
                  transition
                  ${
                    activeSection ===
                    "add"
                      ? "text-slate-900"
                      : "text-slate-400"
                  }
                `}
              >
                <UserPlus size={15} />

                Add people

                {activeSection ===
                  "add" && (
                  <span
                    className="
                      absolute
                      bottom-0 left-0 right-0
                      h-0.5
                      rounded-full
                      bg-slate-900
                    "
                  />
                )}
              </button>
            )}
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {actionError && (
            <div
              className="
                mx-5 mt-4
                rounded-xl
                border border-red-100
                bg-red-50
                px-3 py-2
                text-xs
                text-red-600
              "
            >
              {actionError}
            </div>
          )}

          {/* ==================================================
              MEMBERS
          ================================================== */}

          {activeSection ===
            "members" && (
            <div className="px-5 py-4">
              <div className="space-y-1">
                {existingConversation.participants.map(
                  (user) => {
                    const userId =
                      getConversationUserId(
                        user,
                      );

                    const admin =
                      isUserAdmin(
                        userId,
                      );

                    const current =
                      isCurrentUser(
                        user,
                      );

                    return (
                      <div
                        key={userId}
                        className="
                          flex items-center
                          gap-3
                          rounded-2xl
                          px-2 py-2.5
                          transition
                          hover:bg-slate-50
                        "
                      >
                        {/* AVATAR */}

                        {user.avatar ? (
                          <img
                            src={
                              user.avatar
                            }
                            alt={getConversationUserName(
                              user,
                            )}
                            className="
                              h-10 w-10
                              shrink-0
                              rounded-full
                              object-cover
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex h-10 w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-slate-100
                              text-sm
                              font-bold
                              text-slate-600
                            "
                          >
                            {getConversationUserName(
                              user,
                            )
                              .charAt(
                                0,
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        {/* USER */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-800
                              "
                            >
                              {getConversationUserName(
                                user,
                              )}
                            </p>

                            {current && (
                              <span
                                className="
                                  shrink-0
                                  rounded-md
                                  bg-slate-100
                                  px-1.5 py-0.5
                                  text-[9px]
                                  font-semibold
                                  text-slate-500
                                "
                              >
                                You
                              </span>
                            )}
                          </div>

                          <p
                            className="
                              truncate
                              text-[11px]
                              text-slate-400
                            "
                          >
                            {user.phone ||
                              ""}
                          </p>
                        </div>

                        {/* ADMIN BADGE */}

                        {admin && (
                          <span
                            className="
                              flex shrink-0
                              items-center gap-1
                              rounded-lg
                              bg-amber-50
                              px-2 py-1
                              text-[10px]
                              font-semibold
                              text-amber-600
                            "
                          >
                            <Crown
                              size={11}
                            />

                            Admin
                          </span>
                        )}

                        {/* ADMIN ACTIONS */}

                        {isAdmin &&
                          !current && (
                            <div className="flex items-center gap-1">
                              {!admin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handlePromoteAdmin(
                                        user,
                                      )
                                    }
                                    disabled={
                                      isPromotingAdmin
                                    }
                                    className="
                                      flex h-8 w-8
                                      items-center
                                      justify-center
                                      rounded-lg
                                      text-slate-400
                                      transition
                                      hover:bg-amber-50
                                      hover:text-amber-600
                                      disabled:opacity-50
                                    "
                                    title="Make admin"
                                  >
                                    {isPromotingAdmin ? (
                                      <Loader2
                                        size={
                                          14
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <ShieldCheck
                                        size={
                                          15
                                        }
                                      />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveParticipant(
                                        user,
                                      )
                                    }
                                    disabled={
                                      isRemovingParticipant
                                    }
                                    className="
                                      flex h-8 w-8
                                      items-center
                                      justify-center
                                      rounded-lg
                                      text-slate-400
                                      transition
                                      hover:bg-red-50
                                      hover:text-red-600
                                      disabled:opacity-50
                                    "
                                    title="Remove participant"
                                  >
                                    {isRemovingParticipant ? (
                                      <Loader2
                                        size={
                                          14
                                        }
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <X
                                        size={
                                          15
                                        }
                                      />
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              ADD PEOPLE
          ================================================== */}

          {activeSection ===
            "add" &&
            isAdmin && (
              <div className="px-5 py-4">

                {/* SEARCH */}

                <div
                  className="
                    flex items-center
                    gap-2
                    rounded-xl
                    border border-slate-200
                    bg-slate-50
                    px-3
                  "
                >
                  <Search
                    size={16}
                    className="text-slate-400"
                  />

                  <input
                    value={
                      searchQuery
                    }
                    onChange={(event) =>
                      setSearchQuery(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search people..."
                    className="
                      h-10 min-w-0 flex-1
                      bg-transparent
                      text-sm
                      text-slate-700
                      outline-none
                      placeholder:text-slate-400
                    "
                  />
                </div>

                {/* SELECTED */}

                {selectedUsers.length >
                  0 && (
                  <div className="mt-3">
                    <p
                      className="
                        mb-2
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-400
                      "
                    >
                      Selected (
                      {
                        selectedUsers.length
                      }
                      )
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.map(
                        (user) => (
                          <button
                            key={String(
                              user._id,
                            )}
                            type="button"
                            onClick={() =>
                              toggleUser(
                                user,
                              )
                            }
                            className="
                              flex items-center
                              gap-2
                              rounded-full
                              bg-slate-100
                              px-2 py-1
                              text-xs
                              font-medium
                              text-slate-700
                            "
                          >
                            <span>
                              {getAuthUserName(
                                user,
                              )}
                            </span>

                            <X
                              size={12}
                            />
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* USERS */}

                <div className="mt-4">
                  {isUsersLoading ? (
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        py-10
                      "
                    >
                      <Loader2
                        size={22}
                        className="
                          animate-spin
                          text-slate-400
                        "
                      />
                    </div>
                  ) : filteredUsers.length ===
                    0 ? (
                    <div
                      className="
                        py-10
                        text-center
                      "
                    >
                      <Users
                        size={24}
                        className="
                          mx-auto
                          text-slate-300
                        "
                      />

                      <p
                        className="
                          mt-2
                          text-sm
                          font-medium
                          text-slate-500
                        "
                      >
                        No users found
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map(
                        (user) => {
                          const selected =
                            selectedUsers.some(
                              (
                                item,
                              ) =>
                                String(
                                  item._id,
                                ) ===
                                String(
                                  user._id,
                                ),
                            );

                          return (
                            <button
                              key={String(
                                user._id,
                              )}
                              type="button"
                              onClick={() =>
                                toggleUser(
                                  user,
                                )
                              }
                              className="
                                flex w-full
                                items-center
                                gap-3
                                rounded-2xl
                                px-2 py-2.5
                                text-left
                                transition
                                hover:bg-slate-50
                              "
                            >
                              {/* AVATAR */}

                              {user.avatar ? (
                                <img
                                  src={
                                    user.avatar
                                  }
                                  alt={getAuthUserName(
                                    user,
                                  )}
                                  className="
                                    h-10 w-10
                                    shrink-0
                                    rounded-full
                                    object-cover
                                  "
                                />
                              ) : (
                                <div
                                  className="
                                    flex h-10 w-10
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-slate-100
                                    text-sm
                                    font-bold
                                    text-slate-600
                                  "
                                >
                                  {getAuthUserName(
                                    user,
                                  )
                                    .charAt(
                                      0,
                                    )
                                    .toUpperCase()}
                                </div>
                              )}

                              {/* USER INFO */}

                              <div className="min-w-0 flex-1">
                                <p
                                  className="
                                    truncate
                                    text-sm
                                    font-semibold
                                    text-slate-800
                                  "
                                >
                                  {getAuthUserName(
                                    user,
                                  )}
                                </p>

                                <p
                                  className="
                                    truncate
                                    text-[11px]
                                    text-slate-400
                                  "
                                >
                                  {
                                    user.phone
                                  }
                                </p>
                              </div>

                              {/* CHECK */}

                              <div
                                className={`
                                  flex h-7 w-7
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  border
                                  transition
                                  ${
                                    selected
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-200 text-transparent"
                                  }
                                `}
                              >
                                <Check
                                  size={14}
                                />
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div
          className="
            shrink-0
            border-t border-slate-100
            bg-slate-50/80
            px-5 py-4
          "
        >
          {/* ADD */}

          {activeSection ===
            "add" &&
            isAdmin && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUsers([]);

                    setSearchQuery("");

                    setActionError("");

                    setActiveSection(
                      "members",
                    );
                  }}
                  disabled={isBusy}
                  className="
                    flex-1
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleAddParticipants
                  }
                  disabled={
                    selectedUsers.length ===
                      0 ||
                    isAddingParticipants
                  }
                  className="
                    flex flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-slate-900
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isAddingParticipants ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <UserPlus
                      size={16}
                    />
                  )}

                  Add{" "}
                  {selectedUsers.length >
                  0
                    ? `(${selectedUsers.length})`
                    : ""}
                </button>
              </div>
            )}

          {/* NORMAL MEMBER */}

          {activeSection ===
            "members" &&
            !isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setConfirmLeave(
                    true,
                  )
                }
                disabled={isBusy}
                className="
                  flex w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border border-red-100
                  bg-red-50
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-red-600
                  transition
                  hover:bg-red-100
                  disabled:opacity-50
                "
              >
                <LogOut
                  size={16}
                />

                Leave Group
              </button>
            )}

          {/* ADMIN */}

          {activeSection ===
            "members" &&
            isAdmin && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmLeave(
                      true,
                    )
                  }
                  disabled={isBusy}
                  className="
                    flex w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-slate-600
                    transition
                    hover:bg-slate-100
                    disabled:opacity-50
                  "
                >
                  <LogOut
                    size={16}
                  />

                  Leave Group
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete(
                      true,
                    )
                  }
                  disabled={isBusy}
                  className="
                    flex w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border border-red-100
                    bg-red-50
                    px-4 py-2.5
                    text-sm
                    font-semibold
                    text-red-600
                    transition
                    hover:bg-red-100
                    disabled:opacity-50
                  "
                >
                  <Trash2
                    size={16}
                  />

                  Delete Group
                </button>
              </div>
            )}
        </div>
      </div>

      {/* ==================================================
          LEAVE CONFIRMATION
      ================================================== */}

      {confirmLeave && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            bg-black/40
            p-4
          "
        >
          <div
            className="
              w-full max-w-sm
              rounded-2xl
              bg-white
              p-5
              shadow-2xl
            "
          >
            <h3
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Leave this group?
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              You will no longer receive
              messages from this group.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmLeave(
                    false,
                  )
                }
                disabled={
                  isRemovingParticipant
                }
                className="
                  flex-1
                  rounded-xl
                  border border-slate-200
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleLeaveGroup
                }
                disabled={
                  isRemovingParticipant
                }
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:opacity-50
                "
              >
                {isRemovingParticipant && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE CONFIRMATION
      ================================================== */}

      {confirmDelete && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            bg-black/40
            p-4
          "
        >
          <div
            className="
              w-full max-w-sm
              rounded-2xl
              bg-white
              p-5
              shadow-2xl
            "
          >
            <div
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-xl
                bg-red-50
                text-red-600
              "
            >
              <Trash2
                size={20}
              />
            </div>

            <h3
              className="
                mt-4
                text-base
                font-bold
                text-slate-900
              "
            >
              Delete this group?
            </h3>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-slate-500
              "
            >
              This action will permanently
              delete the group for everyone.
              All group messages will also
              be removed.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDelete(
                    false,
                  )
                }
                disabled={
                  isDeletingGroup
                }
                className="
                  flex-1
                  rounded-xl
                  border border-slate-200
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-slate-600
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteGroup
                }
                disabled={
                  isDeletingGroup
                }
                className="
                  flex flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-red-600
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:opacity-50
                "
              >
                {isDeletingGroup ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2
                    size={15}
                  />
                )}

                {isDeletingGroup
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}