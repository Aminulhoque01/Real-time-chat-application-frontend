"use client";

import {
  Check,
  Crown,
  Loader2,
  LogOut,
  Pencil,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAddParticipantsMutation,
  useCreateGroupMutation,
  usePromoteAdminMutation,
  useRemoveParticipantMutation,
  useRenameGroupMutation,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useGetAllUsersQuery,
  useSearchUsersQuery,
} from "@/src/redux/features/auth/authApi";

import type { User } from "@/src/redux/features/auth/auth.types";

import type {
  Conversation,
} from "@/src/redux/features/conversation/conversation.types";

/* =========================================================
   Props
========================================================= */

interface GroupModalProps {
  isOpen: boolean;

  onClose: () => void;

  currentUserId?: string;

  existingConversation?: Conversation | null;

  onCreated?: (
    conversation: Conversation,
  ) => void;

  onUpdated?: (
    conversation: Conversation,
  ) => void;

  onLeft?: () => void;
}

/* =========================================================
   Group Modal
========================================================= */

export default function GroupModal({
  isOpen,
  onClose,
  currentUserId,
  existingConversation,
  onCreated,
  onUpdated,
  onLeft,
}: GroupModalProps) {
  /* =======================================================
     Mode
  ======================================================= */

  const isManageMode =
    Boolean(existingConversation);

  /* =======================================================
     State
  ======================================================= */

  const [groupName, setGroupName] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedUsers, setSelectedUsers] =
    useState<User[]>([]);

  const [error, setError] =
    useState("");

  const [editingName, setEditingName] =
    useState(false);

  const [newGroupName, setNewGroupName] =
    useState("");

  /* =======================================================
     Mutations
  ======================================================= */

  const [
    createGroup,
    {
      isLoading: isCreating,
    },
  ] = useCreateGroupMutation();

  const [
    addParticipants,
    {
      isLoading: isAdding,
    },
  ] = useAddParticipantsMutation();

  const [
    removeParticipant,
    {
      isLoading: isRemoving,
    },
  ] = useRemoveParticipantMutation();

  const [
    promoteAdmin,
    {
      isLoading: isPromoting,
    },
  ] = usePromoteAdminMutation();

  const [
    renameGroup,
    {
      isLoading: isRenaming,
    },
  ] = useRenameGroupMutation();

  /* =======================================================
     Search
  ======================================================= */

  const trimmedSearch =
    searchQuery.trim();

  /* =======================================================
     Get All Users
     
     Modal open হলে initial users load করবে
  ======================================================= */

  const {
    data: allUsersData,
    isLoading: isLoadingAllUsers,
    isFetching: isFetchingAllUsers,
    isError: isAllUsersError,
  } = useGetAllUsersQuery(
    {
      page: 1,
      limit: 100,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      skip:
        !isOpen ||
        trimmedSearch.length > 0,
    },
  );

  /* =======================================================
     Search Users
     
     Search box-এ কিছু লিখলে search API call হবে
  ======================================================= */

  const {
    data: searchUsersData,
    isLoading: isSearching,
    isFetching: isFetchingSearch,
    isError: isSearchError,
  } = useSearchUsersQuery(
    {
      query: trimmedSearch,
      page: 1,
      limit: 50,
    },
    {
      skip:
        !isOpen ||
        trimmedSearch.length === 0,
    },
  );

  /* =======================================================
     Extract Users
     
     API response:
     
     {
       success: true,
       message: "...",
       data: {
         users: [],
         pagination: {}
       }
     }
     
     RTK Query যদি transformResponse করে
     response.data return করে, তাহলে এখানে
     allUsersData হচ্ছে UsersData.
  ======================================================= */

  const allUsers =
    allUsersData?.users ?? [];

  const searchUsers =
    searchUsersData?.users ?? [];

  /* =======================================================
     Users To Display
     
     Search থাকলে search result
     না থাকলে all users
  ======================================================= */

  const usersToDisplay: User[] =
    trimmedSearch.length > 0
      ? searchUsers
      : allUsers;

  /* =======================================================
     Existing Group Members
  ======================================================= */

  const groupParticipants =
    existingConversation?.participants ??
    [];

  /* =======================================================
     Admin IDs
  ======================================================= */

  const adminIds = useMemo(() => {
    if (!existingConversation) {
      return [];
    }

    const admins =
      existingConversation.admins ??
      [];

    return admins
      .map((admin) => {
        if (
          typeof admin ===
          "string"
        ) {
          return admin;
        }

        return admin?._id;
      })
      .filter(
        (
          id,
        ): id is string =>
          Boolean(id),
      );
  }, [
    existingConversation,
  ]);

  /* =======================================================
     Current User Admin
  ======================================================= */

  const isCurrentUserAdmin =
    Boolean(
      currentUserId &&
        adminIds.includes(
          currentUserId,
        ),
    );

  /* =======================================================
     Existing Member IDs
  ======================================================= */

  const existingMemberIds =
    useMemo(() => {
      return groupParticipants
        .map((participant) => {
          if (
            typeof participant ===
            "string"
          ) {
            return participant;
          }

          return participant?._id;
        })
        .filter(
          (
            id,
          ): id is string =>
            Boolean(id),
        );
    }, [
      groupParticipants,
    ]);

  /* =======================================================
     Reset Modal
  ======================================================= */

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearchQuery("");
      setSelectedUsers([]);
      setError("");
      setEditingName(false);
      setNewGroupName("");

      return;
    }

    if (existingConversation) {
      setGroupName(
        existingConversation.name ??
          "",
      );

      setNewGroupName(
        existingConversation.name ??
          "",
      );
    } else {
      setGroupName("");
      setNewGroupName("");
    }

    setSelectedUsers([]);
    setSearchQuery("");
    setError("");
    setEditingName(false);
  }, [
    isOpen,
    existingConversation,
  ]);

  /* =======================================================
     CREATE MODE USERS
  ======================================================= */

  const createUsersToShow =
    useMemo(() => {
      return usersToDisplay.filter(
        (user) => {
          // নিজের account বাদ
          if (
            user._id ===
            currentUserId
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      usersToDisplay,
      currentUserId,
    ]);

  /* =======================================================
     MANAGE MODE USERS
  ======================================================= */

  const availableUsers =
    useMemo(() => {
      return usersToDisplay.filter(
        (user) => {
          // নিজের account বাদ
          if (
            user._id ===
            currentUserId
          ) {
            return false;
          }

          // Already member হলে বাদ
          if (
            existingMemberIds.includes(
              user._id,
            )
          ) {
            return false;
          }

          return true;
        },
      );
    }, [
      usersToDisplay,
      currentUserId,
      existingMemberIds,
    ]);

  /* =======================================================
     Loading Users
  ======================================================= */

  const isLoadingUsers =
    isLoadingAllUsers ||
    isFetchingAllUsers ||
    isSearching ||
    isFetchingSearch;

  /* =======================================================
     Busy State
  ======================================================= */

  const isBusy =
    isCreating ||
    isAdding ||
    isRemoving ||
    isPromoting ||
    isRenaming;

  /* =======================================================
     Selected Check
  ======================================================= */

  const isSelected = (
    userId: string,
  ) => {
    return selectedUsers.some(
      (user) =>
        user._id === userId,
    );
  };

  /* =======================================================
     Toggle User
  ======================================================= */

  const handleToggleUser = (
    user: User,
  ) => {
    setError("");

    setSelectedUsers(
      (previous) => {
        const exists =
          previous.some(
            (item) =>
              item._id ===
              user._id,
          );

        if (exists) {
          return previous.filter(
            (item) =>
              item._id !==
              user._id,
          );
        }

        return [
          ...previous,
          user,
        ];
      },
    );
  };

  /* =======================================================
     Remove Selected
  ======================================================= */

  const handleRemoveSelected = (
    userId: string,
  ) => {
    setSelectedUsers(
      (previous) =>
        previous.filter(
          (user) =>
            user._id !== userId,
        ),
    );
  };

  /* =======================================================
     CREATE GROUP
  ======================================================= */

  const handleCreateGroup =
    async () => {
      setError("");

      const name =
        groupName.trim();

      if (!name) {
        setError(
          "Please enter a group name.",
        );

        return;
      }

      if (
        selectedUsers.length < 2
      ) {
        setError(
          "Please select at least 2 people.",
        );

        return;
      }

      try {
        const conversation =
          await createGroup({
            name,

            participantIds:
              selectedUsers.map(
                (user) =>
                  user._id,
              ),
          }).unwrap();

        onCreated?.(
          conversation,
        );

        onClose();
      } catch (error: unknown) {
        console.error(
          "Create group error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to create group.",
        );
      }
    };

  /* =======================================================
     ADD PARTICIPANTS
  ======================================================= */

  const handleAddParticipants =
    async () => {
      if (
        !existingConversation
      ) {
        return;
      }

      if (
        selectedUsers.length === 0
      ) {
        setError(
          "Please select at least one user.",
        );

        return;
      }

      setError("");

      try {
        const updated =
          await addParticipants({
            conversationId:
              existingConversation._id,

            participantIds:
              selectedUsers.map(
                (user) =>
                  user._id,
              ),
          }).unwrap();

        setSelectedUsers([]);
        setSearchQuery("");

        onUpdated?.(
          updated,
        );
      } catch (error: unknown) {
        console.error(
          "Add participants error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to add participants.",
        );
      }
    };

  /* =======================================================
     REMOVE PARTICIPANT
  ======================================================= */

  const handleRemoveParticipant =
    async (
      userId: string,
    ) => {
      if (
        !existingConversation
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to remove this member?",
        );

      if (!confirmed) {
        return;
      }

      setError("");

      try {
        const updated =
          await removeParticipant({
            conversationId:
              existingConversation._id,

            userId,
          }).unwrap();

        onUpdated?.(
          updated,
        );

        if (
          userId ===
          currentUserId
        ) {
          onLeft?.();
          onClose();
        }
      } catch (error: unknown) {
        console.error(
          "Remove participant error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to remove participant.",
        );
      }
    };

  /* =======================================================
     PROMOTE ADMIN
  ======================================================= */

  const handlePromoteAdmin =
    async (
      userId: string,
    ) => {
      if (
        !existingConversation
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Make this member an admin?",
        );

      if (!confirmed) {
        return;
      }

      setError("");

      try {
        const updated =
          await promoteAdmin({
            conversationId:
              existingConversation._id,

            userId,
          }).unwrap();

        onUpdated?.(
          updated,
        );
      } catch (error: unknown) {
        console.error(
          "Promote admin error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to promote admin.",
        );
      }
    };

  /* =======================================================
     RENAME GROUP
  ======================================================= */

  const handleRenameGroup =
    async () => {
      if (
        !existingConversation
      ) {
        return;
      }

      const name =
        newGroupName.trim();

      if (!name) {
        setError(
          "Group name cannot be empty.",
        );

        return;
      }

      setError("");

      try {
        const updated =
          await renameGroup({
            conversationId:
              existingConversation._id,

            name,
          }).unwrap();

        setEditingName(false);

        onUpdated?.(
          updated,
        );
      } catch (error: unknown) {
        console.error(
          "Rename group error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to rename group.",
        );
      }
    };

  /* =======================================================
     LEAVE GROUP
  ======================================================= */

  const handleLeaveGroup =
    async () => {
      if (
        !existingConversation ||
        !currentUserId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to leave this group?",
        );

      if (!confirmed) {
        return;
      }

      setError("");

      try {
        await removeParticipant({
          conversationId:
            existingConversation._id,

          userId:
            currentUserId,
        }).unwrap();

        onLeft?.();

        onClose();
      } catch (error: unknown) {
        console.error(
          "Leave group error:",
          error,
        );

        const apiError =
          error as {
            data?: {
              message?: string;
            };
          };

        setError(
          apiError?.data?.message ??
            "Failed to leave group.",
        );
      }
    };

  /* =======================================================
     Don't Render
  ======================================================= */

  if (!isOpen) {
    return null;
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/60 p-4
        backdrop-blur-sm
      "
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-xl
          flex-col
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        role="dialog"
        aria-modal="true"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex items-center
            justify-between
            border-b border-gray-200
            px-5 py-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-full
                bg-blue-100
                text-blue-600
              "
            >
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2
                className="
                  text-lg font-semibold
                  text-gray-900
                "
              >
                {isManageMode
                  ? "Group Info"
                  : "Create Group"}
              </h2>

              <p
                className="
                  text-xs
                  text-gray-500
                "
              >
                {isManageMode
                  ? `${groupParticipants.length} members`
                  : "Create a group and start chatting"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="
              rounded-full
              p-2
              text-gray-500
              transition
              hover:bg-gray-100
              hover:text-gray-800
              disabled:opacity-50
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-5 py-5
          "
        >
          {/* =================================================
              CREATE GROUP NAME
          ================================================= */}

          {!isManageMode && (
            <div className="mb-5">
              <label
                className="
                  mb-2 block
                  text-sm font-medium
                  text-gray-700
                "
              >
                Group Name
              </label>

              <input
                type="text"
                value={groupName}
                onChange={(event) => {
                  setGroupName(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="e.g. Development Team"
                maxLength={100}
                disabled={isBusy}
                className="
                  w-full
                  rounded-xl
                  border border-gray-300
                  bg-white
                  px-4 py-3
                  text-sm
                  text-gray-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  disabled:bg-gray-100
                "
              />
            </div>
          )}

          {/* =================================================
              MANAGE GROUP NAME
          ================================================= */}

          {isManageMode && (
            <div
              className="
                mb-5
                rounded-xl
                bg-gray-50
                p-4
              "
            >
              {!editingName ? (
                <div
                  className="
                    flex items-center
                    justify-between
                  "
                >
                  <div className="min-w-0">
                    <p
                      className="
                        text-xs
                        text-gray-500
                      "
                    >
                      Group Name
                    </p>

                    <h3
                      className="
                        mt-1
                        truncate
                        text-base
                        font-semibold
                        text-gray-900
                      "
                    >
                      {existingConversation?.name ||
                        "Unnamed Group"}
                    </h3>
                  </div>

                  {isCurrentUserAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewGroupName(
                          existingConversation?.name ??
                            "",
                        );

                        setEditingName(
                          true,
                        );

                        setError("");
                      }}
                      disabled={isBusy}
                      className="
                        rounded-lg
                        p-2
                        text-gray-500
                        transition
                        hover:bg-gray-200
                        hover:text-blue-600
                        disabled:opacity-50
                      "
                      title="Rename group"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p
                    className="
                      mb-2
                      text-xs
                      text-gray-500
                    "
                  >
                    Rename Group
                  </p>

                  <div className="flex gap-2">
                    <input
                      value={
                        newGroupName
                      }
                      onChange={(event) =>
                        setNewGroupName(
                          event.target.value,
                        )
                      }
                      maxLength={100}
                      disabled={isRenaming}
                      className="
                        min-w-0 flex-1
                        rounded-lg
                        border border-gray-300
                        bg-white
                        px-3 py-2
                        text-sm
                        text-gray-900
                        outline-none
                        focus:border-blue-500
                        disabled:bg-gray-100
                      "
                    />

                    <button
                      type="button"
                      onClick={
                        handleRenameGroup
                      }
                      disabled={
                        isRenaming ||
                        !newGroupName.trim()
                      }
                      className="
                        rounded-lg
                        bg-blue-600
                        px-3 py-2
                        text-sm
                        font-medium
                        text-white
                        hover:bg-blue-700
                        disabled:opacity-50
                      "
                    >
                      {isRenaming ? (
                        <Loader2
                          className="
                            h-4 w-4
                            animate-spin
                          "
                        />
                      ) : (
                        "Save"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingName(
                          false,
                        )
                      }
                      disabled={isRenaming}
                      className="
                        rounded-lg
                        bg-gray-200
                        px-3 py-2
                        text-sm
                        text-gray-700
                        hover:bg-gray-300
                        disabled:opacity-50
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              SEARCH
          ================================================= */}

          {(isCurrentUserAdmin ||
            !isManageMode) && (
            <div className="mb-4">
              <label
                className="
                  mb-2 block
                  text-sm font-medium
                  text-gray-700
                "
              >
                {isManageMode
                  ? "Add Participants"
                  : "Add People"}
              </label>

              <div className="relative">
                <Search
                  className="
                    absolute left-3
                    top-1/2
                    h-4 w-4
                    -translate-y-1/2
                    text-gray-400
                  "
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(
                      event.target.value,
                    );

                    setError("");
                  }}
                  placeholder="Search by name or phone..."
                  disabled={isBusy}
                  className="
                    w-full
                    rounded-xl
                    border border-gray-300
                    bg-white
                    py-3 pl-10 pr-4
                    text-sm
                    text-gray-900
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-500/20
                    disabled:bg-gray-100
                  "
                />
              </div>

              <p
                className="
                  mt-2
                  text-xs
                  text-gray-400
                "
              >
                {trimmedSearch
                  ? `Searching for "${trimmedSearch}"`
                  : "All available users are shown below"}
              </p>
            </div>
          )}

          {/* =================================================
              SELECTED USERS
          ================================================= */}

          {selectedUsers.length > 0 && (
            <div className="mb-5">
              <div
                className="
                  mb-2
                  flex items-center
                  justify-between
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Selected Members
                </p>

                <span
                  className="
                    rounded-full
                    bg-blue-100
                    px-2 py-0.5
                    text-xs
                    font-semibold
                    text-blue-600
                  "
                >
                  {selectedUsers.length}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(
                  (user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() =>
                        handleRemoveSelected(
                          user._id,
                        )
                      }
                      disabled={isBusy}
                      className="
                        flex items-center
                        gap-2
                        rounded-full
                        bg-blue-50
                        px-2 py-1.5
                        text-xs
                        font-medium
                        text-blue-700
                        transition
                        hover:bg-blue-100
                        disabled:opacity-50
                      "
                    >
                      {user.avatar ? (
                        <img
                          src={
                            user.avatar
                          }
                          alt={
                            user.name ||
                            "User"
                          }
                          className="
                            h-6 w-6
                            rounded-full
                            object-cover
                          "
                        />
                      ) : (
                        <span
                          className="
                            flex h-6 w-6
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-200
                            text-[10px]
                            font-bold
                          "
                        >
                          {user.name
                            ?.charAt(0)
                            .toUpperCase() ||
                            "U"}
                        </span>
                      )}

                      <span
                        className="
                          max-w-[110px]
                          truncate
                        "
                      >
                        {user.name ||
                          user.phone}
                      </span>

                      <X
                        className="
                          h-3.5 w-3.5
                        "
                      />
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* =================================================
              CREATE MODE USERS
          ================================================= */}

          {!isManageMode && (
            <div className="space-y-1">
              {isLoadingUsers ? (
                <LoadingUsers
                  message={
                    trimmedSearch
                      ? "Searching users..."
                      : "Loading users..."
                  }
                />
              ) : isAllUsersError &&
                !trimmedSearch ? (
                <EmptyUsers
                  searching={false}
                  message="Failed to load users. Please try again."
                />
              ) : isSearchError &&
                trimmedSearch ? (
                <EmptyUsers
                  searching={true}
                  message="Failed to search users. Please try again."
                />
              ) : createUsersToShow.length ===
                0 ? (
                <EmptyUsers
                  searching={Boolean(
                    trimmedSearch,
                  )}
                  message={
                    trimmedSearch
                      ? "No users found."
                      : "No users available."
                  }
                />
              ) : (
                createUsersToShow.map(
                  (user) => (
                    <UserSelectItem
                      key={
                        user._id
                      }
                      user={user}
                      selected={isSelected(
                        user._id,
                      )}
                      onClick={() =>
                        handleToggleUser(
                          user,
                        )
                      }
                    />
                  ),
                )
              )}
            </div>
          )}

          {/* =================================================
              MANAGE MODE - ADD USERS
          ================================================= */}

          {isManageMode &&
            isCurrentUserAdmin && (
              <div className="mb-6 space-y-1">
                {isLoadingUsers ? (
                  <LoadingUsers
                    message={
                      trimmedSearch
                        ? "Searching users..."
                        : "Loading users..."
                    }
                  />
                ) : isAllUsersError &&
                  !trimmedSearch ? (
                  <EmptyUsers
                    searching={false}
                    message="Failed to load users. Please try again."
                  />
                ) : isSearchError &&
                  trimmedSearch ? (
                  <EmptyUsers
                    searching={true}
                    message="Failed to search users. Please try again."
                  />
                ) : availableUsers.length ===
                  0 ? (
                  <EmptyUsers
                    searching={Boolean(
                      trimmedSearch,
                    )}
                    message={
                      trimmedSearch
                        ? "No users found."
                        : "No users available to add."
                    }
                  />
                ) : (
                  availableUsers.map(
                    (user) => (
                      <UserSelectItem
                        key={
                          user._id
                        }
                        user={user}
                        selected={isSelected(
                          user._id,
                        )}
                        onClick={() =>
                          handleToggleUser(
                            user,
                          )
                        }
                      />
                    ),
                  )
                )}
              </div>
            )}

          {/* =================================================
              GROUP MEMBERS
          ================================================= */}

          {isManageMode && (
            <div>
              <div
                className="
                  mb-3
                  flex items-center
                  justify-between
                "
              >
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-gray-500
                  "
                >
                  Members
                </p>

                <span
                  className="
                    text-xs
                    text-gray-500
                  "
                >
                  {groupParticipants.length}
                </span>
              </div>

              <div className="space-y-1">
                {groupParticipants.map(
                  (participant) => {
                    const user =
                      typeof participant ===
                      "string"
                        ? null
                        : participant;

                    if (!user) {
                      return null;
                    }

                    const userId =
                      user._id;

                    const isAdmin =
                      adminIds.includes(
                        userId,
                      );

                    const isMe =
                      userId ===
                      currentUserId;

                    return (
                      <div
                        key={userId}
                        className="
                          flex
                          items-center
                          gap-3
                          rounded-xl
                          px-3 py-3
                          hover:bg-gray-50
                        "
                      >
                        {/* Avatar */}

                        {user.avatar ? (
                          <img
                            src={
                              user.avatar
                            }
                            alt={
                              user.name ||
                              "User"
                            }
                            className="
                              h-11 w-11
                              shrink-0
                              rounded-full
                              object-cover
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex h-11 w-11
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-gray-200
                              text-sm
                              font-semibold
                              text-gray-600
                            "
                          >
                            {user.name
                              ?.charAt(0)
                              .toUpperCase() ||
                              "U"}
                          </div>
                        )}

                        {/* Info */}

                        <div
                          className="
                            min-w-0 flex-1
                          "
                        >
                          <div
                            className="
                              flex items-center
                              gap-2
                            "
                          >
                            <p
                              className="
                                truncate
                                text-sm
                                font-medium
                                text-gray-900
                              "
                            >
                              {isMe
                                ? "You"
                                : user.name ||
                                  "Unknown User"}
                            </p>

                            {isAdmin && (
                              <span
                                className="
                                  flex items-center
                                  gap-1
                                  rounded-full
                                  bg-yellow-100
                                  px-2 py-0.5
                                  text-[10px]
                                  font-medium
                                  text-yellow-700
                                "
                              >
                                <Crown
                                  className="
                                    h-3 w-3
                                  "
                                />

                                Admin
                              </span>
                            )}
                          </div>

                          <p
                            className="
                              truncate
                              text-xs
                              text-gray-500
                            "
                          >
                            {user.phone}
                          </p>
                        </div>

                        {/* Admin Actions */}

                        {isCurrentUserAdmin &&
                          !isMe && (
                            <div
                              className="
                                flex
                                items-center
                                gap-1
                              "
                            >
                              {!isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePromoteAdmin(
                                      userId,
                                    )
                                  }
                                  disabled={
                                    isBusy
                                  }
                                  title="Make Admin"
                                  className="
                                    rounded-lg
                                    p-2
                                    text-gray-400
                                    transition
                                    hover:bg-yellow-50
                                    hover:text-yellow-600
                                    disabled:opacity-50
                                  "
                                >
                                  <ShieldCheck
                                    className="
                                      h-4 w-4
                                    "
                                  />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveParticipant(
                                    userId,
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                                title="Remove Member"
                                className="
                                  rounded-lg
                                  p-2
                                  text-gray-400
                                  transition
                                  hover:bg-red-50
                                  hover:text-red-600
                                  disabled:opacity-50
                                "
                              >
                                <UserMinus
                                  className="
                                    h-4 w-4
                                  "
                                />
                              </button>
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-4
                rounded-xl
                bg-red-50
                px-4 py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            border-t
            border-gray-200
            px-5 py-4
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {/* =================================================
                Leave Group
            ================================================= */}

            {isManageMode ? (
              <button
                type="button"
                onClick={
                  handleLeaveGroup
                }
                disabled={isBusy}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  px-4 py-2.5
                  text-sm
                  font-medium
                  text-red-600
                  transition
                  hover:bg-red-50
                  disabled:opacity-50
                "
              >
                <LogOut
                  className="
                    h-4 w-4
                  "
                />

                Leave Group
              </button>
            ) : (
              <div />
            )}

            {/* =================================================
                Actions
            ================================================= */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="
                  rounded-xl
                  px-4 py-2.5
                  text-sm
                  font-medium
                  text-gray-600
                  transition
                  hover:bg-gray-100
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              {/* =================================================
                  CREATE
              ================================================= */}

              {!isManageMode && (
                <button
                  type="button"
                  onClick={
                    handleCreateGroup
                  }
                  disabled={
                    isCreating ||
                    !groupName.trim() ||
                    selectedUsers.length <
                      2
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5 py-2.5
                    text-sm
                    font-medium
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isCreating ? (
                    <>
                      <Loader2
                        className="
                          h-4 w-4
                          animate-spin
                        "
                      />

                      Creating...
                    </>
                  ) : (
                    <>
                      <Users
                        className="
                          h-4 w-4
                        "
                      />

                      Create Group
                    </>
                  )}
                </button>
              )}

              {/* =================================================
                  ADD MEMBERS
              ================================================= */}

              {isManageMode &&
                isCurrentUserAdmin &&
                selectedUsers.length >
                  0 && (
                  <button
                    type="button"
                    onClick={
                      handleAddParticipants
                    }
                    disabled={
                      isAdding
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-blue-600
                      px-5 py-2.5
                      text-sm
                      font-medium
                      text-white
                      transition
                      hover:bg-blue-700
                      disabled:opacity-50
                    "
                  >
                    {isAdding ? (
                      <>
                        <Loader2
                          className="
                            h-4 w-4
                            animate-spin
                          "
                        />

                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus
                          className="
                            h-4 w-4
                          "
                        />

                        Add{" "}
                        {
                          selectedUsers.length
                        }{" "}
                        Members
                      </>
                    )}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================
   User Select Item
=========================================================== */

interface UserSelectItemProps {
  user: User;

  selected: boolean;

  onClick: () => void;
}

const UserSelectItem = ({
  user,
  selected,
  onClick,
}: UserSelectItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex w-full
        items-center
        gap-3
        rounded-xl
        px-3 py-3
        text-left
        transition

        ${
          selected
            ? "bg-blue-50 ring-1 ring-blue-100"
            : "hover:bg-gray-100"
        }
      `}
    >
      {/* Avatar */}

      {user.avatar ? (
        <img
          src={user.avatar}
          alt={
            user.name ||
            "User"
          }
          className="
            h-11 w-11
            shrink-0
            rounded-full
            object-cover
          "
        />
      ) : (
        <div
          className="
            flex h-11 w-11
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-gray-200
            text-sm
            font-semibold
            text-gray-600
          "
        >
          {user.name
            ?.charAt(0)
            .toUpperCase() ||
            "U"}
        </div>
      )}

      {/* User Info */}

      <div
        className="
          min-w-0 flex-1
        "
      >
        <p
          className="
            truncate
            text-sm
            font-medium
            text-gray-900
          "
        >
          {user.name ||
            "Unknown User"}
        </p>

        <p
          className="
            truncate
            text-xs
            text-gray-500
          "
        >
          {user.phone ||
            "No phone number"}
        </p>
      </div>

      {/* Selected */}

      <div
        className={`
          flex h-6 w-6
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          transition

          ${
            selected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 bg-white"
          }
        `}
      >
        {selected && (
          <Check
            className="
              h-4 w-4
            "
          />
        )}
      </div>
    </button>
  );
};

/* ===========================================================
   Loading Users
=========================================================== */

const LoadingUsers = ({
  message = "Loading users...",
}: {
  message?: string;
}) => {
  return (
    <div
      className="
        py-8
        text-center
      "
    >
      <div
        className="
          mx-auto
          h-6 w-6
          animate-spin
          rounded-full
          border-2
          border-gray-300
          border-t-blue-500
        "
      />

      <p
        className="
          mt-2
          text-xs
          text-gray-500
        "
      >
        {message}
      </p>
    </div>
  );
};

/* ===========================================================
   Empty Users
=========================================================== */

const EmptyUsers = ({
  searching,
  message,
}: {
  searching: boolean;
  message?: string;
}) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-dashed
        border-gray-300
        px-4 py-8
        text-center
      "
    >
      <Users
        className="
          mx-auto mb-2
          h-8 w-8
          text-gray-300
        "
      />

      <p
        className="
          text-sm
          text-gray-500
        "
      >
        {message ??
          (searching
            ? "No users found."
            : "No users available.")}
      </p>
    </div>
  );
};