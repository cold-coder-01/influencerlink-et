"use client";

import { useEffect, useRef, useState } from "react";

type ProfileAvatarEditorProps = {
  displayName: string;
  email?: string;
  initials: string;
  endpoint?: string;
  label?: string;
  showDetails?: boolean;
  variant?: "hero" | "settings";
};

type ProfileImageResponse = {
  success: boolean;
  error?: string;
  data?: {
    displayName?: string;
    email?: string;
    image?: string | null;
  };
};

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z" />
      <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    </svg>
  );
}

export function ProfileAvatarEditor({
  displayName,
  email,
  endpoint = "/api/profile/avatar",
  initials,
  label = "Business Owner",
  showDetails = true,
  variant = "hero",
}: ProfileAvatarEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const avatarSize =
    variant === "settings" ? "h-20 w-20 text-xl" : "h-[52px] w-[52px] text-sm";

  useEffect(() => {
    let isMounted = true;

    fetch(endpoint, { cache: "no-store" })
      .then((response) => response.json() as Promise<ProfileImageResponse>)
      .then((payload) => {
        if (isMounted && payload.success) {
          setImage(payload.data?.image ?? null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setImage(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  async function uploadProfileImage(file: File) {
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("image", file);

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        body: formData,
      });
      const payload = (await response.json()) as ProfileImageResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Profile image could not be updated.");
      }

      setImage(payload.data?.image ?? null);
      setMessage("Profile picture updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Profile image could not be updated.",
      );
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="relative">
        <div
          className={`relative grid ${avatarSize} overflow-hidden rounded-full border border-[#2ED3FF]/45 bg-white/[0.14] place-items-center font-bold text-white`}
        >
          {image ? (
            <img
              alt={`${displayName} profile`}
              className="h-full w-full object-cover"
              src={image}
            />
          ) : (
            <span>{initials}</span>
          )}
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#081B5D] bg-[#32D583]" />
        </div>
        <button
          aria-label="Edit profile picture"
          className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border border-white/40 bg-[#1D4DFF] text-white shadow-[0_10px_24px_rgba(0,0,0,0.34)] transition active:scale-95 disabled:cursor-wait disabled:opacity-70"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <CameraIcon />
        </button>
        <input
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              void uploadProfileImage(file);
            }
          }}
          type="file"
        />
      </div>
      {showDetails ? (
        <div className="hidden min-w-0 pr-1 min-[390px]:block">
          <p className="truncate text-xs font-semibold leading-4 text-white">{label}</p>
          <p className="truncate text-[11px] leading-4 text-white/66">
            {isLoading ? "Uploading" : "Active"}
          </p>
          {message ? (
            <p className="mt-0.5 max-w-28 truncate text-[10px] leading-3 text-[#9CEFFF]">
              {message}
            </p>
          ) : null}
        </div>
      ) : null}
      {variant === "settings" ? (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{displayName}</p>
          <p className="truncate text-sm text-white/70">{email}</p>
          <p className="mt-1 text-xs text-[#9CEFFF]">
            {message ?? (isLoading ? "Uploading profile picture" : label)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
