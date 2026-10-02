
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Users,
  Check,
} from "lucide-react";

import {
  useCreateGroupMutation,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useGetAllUsersQuery,
  useSearchUsersQuery,
} from "@/src/redux/features/user/userApi";

import type { User } from "@/src/redux/features/auth/auth.types";

import type { Conversation } from "@/src/redux/features/conversation/conversation.types";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (conversation: Conversation) => void;

  // Current logged-in user id
  currentUserId?: string;
}

const CreateGroupModal = ({
  isOpen,
  onClose,
  onCreated,
  currentUserId,
}: CreateGroupModalProps) => {
  // =========================
  // State
  // =========================

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] =
    useState<User[]>([]);
  const [error, setError] = useState("");

  // =========================
  // Create Group
  // =========================

  const [
    createGroup,
    {
      isLoading: isCreating,
    },
  ] = useCreateGroupMutation();

  // =========================
  // Get All Users
  // =========================

  const {
    data: allUsers = [],
    isLoading: isLoadingAllUsers,
    isFetching: isFetchingAllUsers,
  } = useGetAllUsersQuery(undefined, {
    skip: !isOpen,
  });

  console.log(allUsers)
  // =========================
  // Search Users
  // =========================

  const {
    data: searchResults = [],
    isLoading: isSearching,
    isFetching: isFetchingSearch,
  } = useSearchUsersQuery(searchQuery.trim(), {
    skip:
      !isOpen ||
      searchQuery.trim().length === 0,
  });

  // =========================
  // Reset
  // =========================

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearchQuery("");
      setSelectedUsers([]);
      setError("");
    }
  }, [isOpen]);

  // =========================
  // Users To Show
  // =========================

  const usersToShow = useMemo(() => {
    const users =
      searchQuery.trim().length > 0
        ? searchResults
        : allUsers;

    // Current logged-in user বাদ
    return users.filter(
      (user) => user._id !== currentUserId,
    );
  }, [
    allUsers,
    searchResults,
    searchQuery,
    currentUserId,
  ]);

  // =========================
  // Selected Check
  // =========================

  const isSelected = (
    userId: string,
  ) => {
    return selectedUsers.some(
      (user) => user._id === userId,
    );
  };

  // =========================
  // Toggle User
  // =========================

  const handleToggleUser = (
    user: User,
  ) => {
    setError("");

    setSelectedUsers((previous) => {
      const alreadySelected =
        previous.some(
          (item) =>
            item._id === user._id,
        );

      if (alreadySelected) {
        return previous.filter(
          (item) =>
            item._id !== user._id,
        );
      }

      return [
        ...previous,
        user,
      ];
    });
  };

  // =========================
  // Remove Selected User
  // =========================

  const handleRemoveSelected = (
    userId: string,
  ) => {
    setSelectedUsers((previous) =>
      previous.filter(
        (user) =>
          user._id !== userId,
      ),
    );
  };

  // =========================
  // Create Group
  // =========================

  const handleCreateGroup =
    async () => {
      setError("");

      const trimmedName =
        groupName.trim();

      // Group name
      if (!trimmedName) {
        setError(
          "Please enter a group name.",
        );

        return;
      }

      // Minimum 2 other users
      if (
        selectedUsers.length < 2
      ) {
        setError(
          "Please select at least 2 people to create a group.",
        );

        return;
      }

      try {
        const conversation =
          await createGroup({
            name: trimmedName,
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

        if (
          typeof error ===
            "object" &&
          error !== null &&
          "data" in error
        ) {
          const apiError =
            error as {
              data?: {
                message?: string;
              };
            };

          setError(
            apiError.data
              ?.message ||
              "Failed to create group.",
          );

          return;
        }

        setError(
          "Something went wrong while creating the group.",
        );
      }
    };

  // =========================
  // Don't Render
  // =========================

  if (!isOpen) {
    return null;
  }

  // =========================
  // Loading State
  // =========================

  const isLoadingUsers =
    searchQuery.trim().length > 0
      ? isSearching ||
        isFetchingSearch
      : isLoadingAllUsers ||
        isFetchingAllUsers;

  // =========================
  // UI
  // =========================

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-group-title"
      >
        {/* =========================
            Header
        ========================= */}

        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="create-group-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Create Group
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add people to your new group
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* =========================
            Body
        ========================= */}

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {/* =========================
              Group Name
          ========================= */}

          <div className="mb-5">
            <label
              htmlFor="group-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Group Name
            </label>

            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(event) => {
                setGroupName(
                  event.target.value,
                );

                setError("");
              }}
              placeholder="Enter group name"
              maxLength={100}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* =========================
              Search Users
          ========================= */}

          <div className="mb-4">
            <label
              htmlFor="group-user-search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Add People
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="group-user-search"
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(
                    event.target.value,
                  );

                  setError("");
                }}
                placeholder="Search by name or phone..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* =========================
              Selected Users
          ========================= */}

          {selectedUsers.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Selected
                </p>

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {
                    selectedUsers.length
                  }{" "}
                  selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(
                  (user) => (
                    <button
                      key={
                        user._id
                      }
                      type="button"
                      onClick={() =>
                        handleRemoveSelected(
                          user._id,
                        )
                      }
                      className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    >
                      {user.avatar ? (
                        <img
                          src={
                            user.avatar
                          }
                          alt={
                            user.name
                          }
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-[10px] font-semibold text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                          {user.name
                            ?.charAt(
                              0,
                            )
                            .toUpperCase()}
                        </span>
                      )}

                      <span className="max-w-[120px] truncate">
                        {
                          user.name
                        }
                      </span>

                      <X className="h-3.5 w-3.5" />
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* =========================
              User List
          ========================= */}

          <div>
            {/* Loading */}

            {isLoadingUsers ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {searchQuery.trim()
                    ? "Searching..."
                    : "Loading users..."}
                </p>
              </div>
            ) : usersToShow.length ===
              0 ? (
              /* Empty */

              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
                <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery.trim()
                    ? "No users found."
                    : "No users available."}
                </p>
              </div>
            ) : (
              /* Users */

              <div className="space-y-1">
                {usersToShow.map(
                  (user) => {
                    const selected =
                      isSelected(
                        user._id,
                      );

                    return (
                      <button
                        key={
                          user._id
                        }
                        type="button"
                        onClick={() =>
                          handleToggleUser(
                            user,
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        {/* Avatar */}

                        {user.avatar ? (
                          <img
                            src={
                              user.avatar
                            }
                            alt={
                              user.name
                            }
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                            {user.name
                              ?.charAt(
                                0,
                              )
                              .toUpperCase()}
                          </div>
                        )}

                        {/* User Info */}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {
                              user.name
                            }
                          </p>

                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {
                              user.phone
                            }
                          </p>
                        </div>

                        {/* Check */}

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                            selected
                              ? "border-blue-500 bg-blue-500 text-white"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {selected && (
                            <Check className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* =========================
              Error
          ========================= */}

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* =========================
            Footer
        ========================= */}

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              handleCreateGroup
            }
            disabled={
              isCreating ||
              !groupName.trim() ||
              selectedUsers.length < 2
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating...
              </span>
            ) : (
              "Create Group"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
``
