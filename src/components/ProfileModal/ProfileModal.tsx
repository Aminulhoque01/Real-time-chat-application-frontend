"use client";

import {
  Camera,
  Edit3,
  LogOut,
  X,
  ShieldOff,
  ShieldCheck,
  Loader2,
  Save,
  Ban,
} from "lucide-react";

import type { User } from "@/src/redux/features/auth/auth.types";

interface ProfileModalProps {
  user: User | null;
  isOwnProfile: boolean;
  isOpen: boolean;

  onClose: () => void;

  onEditProfile?: () => void;
  onLogout?: () => void;

  onBlock?: () => void;
  onUnblock?: () => void;

  isBlocked?: boolean;
  isBlockLoading?: boolean;

  isUploadingAvatar?: boolean;

  onAvatarChange?: (file: File) => void;

  // ==========================================
  // PROFILE EDITING
  // ==========================================

  isEditing?: boolean;

  editName?: string;
  editBio?: string;

  onEditNameChange?: (value: string) => void;
  onEditBioChange?: (value: string) => void;

  onSaveProfile?: () => void;
  onCancelEdit?: () => void;

  isUpdatingProfile?: boolean;
}

const formatLastSeen = (date?: string) => {
  if (!date) {
    return "Offline";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Offline";
  }

  return parsedDate.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function ProfileModal({
  user,
  isOwnProfile,
  isOpen,
  onClose,
  onEditProfile,
  onLogout,
  onBlock,
  onUnblock,
  isBlocked = false,
  isBlockLoading = false,
  isUploadingAvatar = false,
  onAvatarChange,

  // ==========================================
  // EDIT PROPS
  // ==========================================

  isEditing = false,

  editName = "",
  editBio = "",

  onEditNameChange,
  onEditBioChange,

  onSaveProfile,
  onCancelEdit,

  isUpdatingProfile = false,
}: ProfileModalProps) {
  if (!isOpen || !user) {
    return null;
  }

  const displayName =
    user.name?.trim() ||
    user.phone ||
    "Unknown User";

  const initial = displayName
    .charAt(0)
    .toUpperCase();

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onAvatarChange?.(file);

    event.target.value = "";
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/40
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative
          flex
          max-h-[90vh]
          w-full
          max-w-md
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
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-100
            px-5
            py-4
          "
        >
          <h2
            className="
              text-base
              font-bold
              text-slate-800
            "
          >
            {isOwnProfile
              ? isEditing
                ? "Edit Profile"
                : "My Profile"
              : "Profile"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
            aria-label="Close profile"
          >
            <X size={19} />
          </button>
        </div>

        {/* ==================================================
            PROFILE CONTENT
        ================================================== */}

        <div className="overflow-y-auto px-6 py-7">
          {/* ==================================================
              AVATAR
          ================================================== */}

          <div className="flex justify-center">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="
                    h-28
                    w-28
                    rounded-full
                    object-cover
                    ring-4
                    ring-slate-100
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-28
                    w-28
                    items-center
                    justify-center
                    rounded-full
                    bg-slate-900
                    text-4xl
                    font-bold
                    text-white
                    ring-4
                    ring-slate-100
                  "
                >
                  {initial}
                </div>
              )}

              {/* ==================================================
                  CHANGE AVATAR
              ================================================== */}

              {isOwnProfile &&
                !isEditing &&
                onAvatarChange && (
                  <>
                    <label
                      htmlFor="profile-avatar-input"
                      className="
                        absolute
                        bottom-1
                        right-1
                        flex
                        h-9
                        w-9
                        cursor-pointer
                        items-center
                        justify-center
                        rounded-full
                        border-2
                        border-white
                        bg-slate-900
                        text-white
                        shadow-md
                        transition
                        hover:bg-slate-700
                      "
                    >
                      {isUploadingAvatar ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Camera size={16} />
                      )}
                    </label>

                    <input
                      id="profile-avatar-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={
                        isUploadingAvatar
                      }
                      onChange={
                        handleFileChange
                      }
                    />
                  </>
                )}
            </div>
          </div>

          {/* ==================================================
              EDIT MODE
          ================================================== */}

          {isOwnProfile && isEditing ? (
            <div className="mt-7 space-y-5">
              {/* NAME */}

              <div>
                <label
                  htmlFor="profile-name"
                  className="
                    mb-2
                    block
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    onEditNameChange?.(
                      event.target.value,
                    )
                  }
                  maxLength={100}
                  disabled={
                    isUpdatingProfile
                  }
                  placeholder="Enter your name"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    text-sm
                    font-medium
                    text-slate-700
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-slate-300
                    focus:bg-white
                    focus:ring-2
                    focus:ring-slate-100
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-[10px]
                    text-slate-400
                  "
                >
                  {editName.length}/100
                </p>
              </div>

              {/* BIO */}

              <div>
                <label
                  htmlFor="profile-bio"
                  className="
                    mb-2
                    block
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Bio
                </label>

                <textarea
                  id="profile-bio"
                  value={editBio}
                  onChange={(event) =>
                    onEditBioChange?.(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  rows={4}
                  disabled={
                    isUpdatingProfile
                  }
                  placeholder="Tell something about yourself..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    text-slate-700
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-slate-300
                    focus:bg-white
                    focus:ring-2
                    focus:ring-slate-100
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />

                <p
                  className="
                    mt-1
                    text-right
                    text-[10px]
                    text-slate-400
                  "
                >
                  {editBio.length}/500
                </p>
              </div>

              {/* PHONE - READ ONLY */}

              <div>
                <p
                  className="
                    text-[11px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                  "
                >
                  Phone
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-medium
                    text-slate-700
                  "
                >
                  {user.phone ||
                    "Not available"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ==================================================
                  NAME + ONLINE STATUS
              ================================================== */}

              <div className="mt-5 text-center">
                <h3
                  className="
                    text-xl
                    font-bold
                    text-slate-800
                  "
                >
                  {displayName}
                </h3>

                {user.isOnline ? (
                  <div
                    className="
                      mt-1
                      flex
                      items-center
                      justify-center
                      gap-1.5
                      text-xs
                      text-emerald-600
                    "
                  >
                    <span
                      className="
                        h-2
                        w-2
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    Active now
                  </div>
                ) : (
                  <p
                    className="
                      mt-1
                      text-xs
                      text-slate-400
                    "
                  >
                    Last seen{" "}
                    {formatLastSeen(
                      user.lastSeen,
                    )}
                  </p>
                )}
              </div>

              {/* ==================================================
                  USER DETAILS
              ================================================== */}

              <div className="mt-7 space-y-4">
                {/* PHONE */}

                <div>
                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Phone
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-medium
                      text-slate-700
                    "
                  >
                    {user.phone ||
                      "Not available"}
                  </p>
                </div>

                {/* BIO */}

                <div>
                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-slate-400
                    "
                  >
                    Bio
                  </p>

                  <p
                    className="
                      mt-1
                      whitespace-pre-wrap
                      break-words
                      text-sm
                      text-slate-600
                    "
                  >
                    {user.bio?.trim() ||
                      "No bio yet."}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================================================
            ACTIONS
        ================================================== */}

        <div
          className="
            shrink-0
            border-t
            border-slate-100
            p-4
          "
        >
          {/* ==================================================
              OWN PROFILE
          ================================================== */}

          {isOwnProfile ? (
            isEditing ? (
              <div className="flex gap-2">
                {/* CANCEL */}

                <button
                  type="button"
                  onClick={
                    onCancelEdit
                  }
                  disabled={
                    isUpdatingProfile
                  }
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  <X size={17} />
                  Cancel
                </button>

                {/* SAVE */}

                <button
                  type="button"
                  onClick={
                    onSaveProfile
                  }
                  disabled={
                    isUpdatingProfile ||
                    !editName.trim()
                  }
                  className="
                    flex
                    flex-1
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-slate-900
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {isUpdatingProfile ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {isUpdatingProfile
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* EDIT */}

                <button
                  type="button"
                  onClick={
                    onEditProfile
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-slate-900
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-slate-800
                  "
                >
                  <Edit3 size={17} />
                  Edit Profile
                </button>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={onLogout}
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    border-red-100
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-red-500
                    transition
                    hover:bg-red-50
                  "
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )
          ) : (
            /* ==================================================
               OTHER USER
            ================================================== */

            <button
              type="button"
              disabled={isBlockLoading}
              onClick={
                isBlocked
                  ? onUnblock
                  : onBlock
              }
              className={`
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-3
                text-sm
                font-semibold
                transition
                disabled:cursor-not-allowed
                disabled:opacity-60

                ${
                  isBlocked
                    ? `
                      border
                      border-emerald-100
                      text-emerald-600
                      hover:bg-emerald-50
                    `
                    : `
                      border
                      border-red-100
                      text-red-500
                      hover:bg-red-50
                    `
                }
              `}
            >
              {isBlockLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : isBlocked ? (
                <ShieldCheck
                  size={17}
                />
              ) : (
                <ShieldOff
                  size={17}
                />
              )}

              {isBlocked
                ? "Unblock User"
                : "Block User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}