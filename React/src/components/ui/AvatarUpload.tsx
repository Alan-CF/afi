import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PencilIcon, UserIcon, PhotoIcon, SparklesIcon } from "@heroicons/react/24/solid";

interface AvatarUploadProps {
  avatarUrl?: string | null;
  userId: string;
  onUploadSuccess?: (newUrl: string) => void;
  /**
   * When provided, clicking the avatar opens a menu (Change photo / Change frame)
   * instead of opening the file picker directly. Omit to keep legacy behavior.
   */
  onChangeFrame?: () => void;
  size?: number;
}

export default function AvatarUpload({
  avatarUrl,
  userId,
  onUploadSuccess,
  onChangeFrame,
  size = 88,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG and PNG images are allowed.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Error uploading image.");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setImgError(false);
    window.dispatchEvent(new CustomEvent("profile-updated"));
    onUploadSuccess?.(publicUrl);

    if (!avatarUrl) {
      await supabase.rpc("award_points", {
        p_profile_id: userId,
        p_event_key: "add_pfp",
      });
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const hasValidAvatar = avatarUrl && !imgError;
  const hasMenu = typeof onChangeFrame === "function";

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleAvatarClick = () => {
    if (hasMenu) setMenuOpen((v) => !v);
    else triggerFilePicker();
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup={hasMenu ? "menu" : undefined}
        aria-expanded={hasMenu ? menuOpen : undefined}
        className="relative group cursor-pointer rounded-full overflow-hidden border-2 border-white/20"
        style={{ width: size, height: size }}
        onClick={handleAvatarClick}
      >
        {hasValidAvatar ? (
          <img
            src={avatarUrl ?? undefined}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/60">
            <UserIcon
              className="text-white"
              style={{ width: size * 0.5, height: size * 0.5 }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilIcon className="h-5 w-5 text-white" />
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {hasMenu && menuOpen ? (
        <div
          role="menu"
          className="absolute left-1/2 z-30 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-xl border border-container-border bg-white shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              triggerFilePicker();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left font-lato text-sm font-semibold text-secondary transition-colors hover:bg-text-light-soft"
          >
            <PhotoIcon className="h-5 w-5" />
            Change profile photo
          </button>
          <div className="h-px bg-container-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onChangeFrame?.();
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left font-lato text-sm font-semibold text-secondary transition-colors hover:bg-text-light-soft"
          >
            <SparklesIcon className="h-5 w-5" />
            Change frame
          </button>
        </div>
      ) : null}
    </div>
  );
}
