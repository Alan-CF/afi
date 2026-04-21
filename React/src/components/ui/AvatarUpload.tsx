import { useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { PencilIcon, UserIcon } from "@heroicons/react/24/solid";

interface AvatarUploadProps {
  avatarUrl?: string | null;
  userId: string;
  onUploadSuccess?: (newUrl: string) => void;
  size?: number; // px, default 88
}

export default function AvatarUpload({
  avatarUrl,
  userId,
  onUploadSuccess,
  size = 88,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    onUploadSuccess?.(publicUrl);
  };

  return (
    <>
      <div
        className="relative group cursor-pointer rounded-full overflow-hidden border-2 border-white/20"
        style={{ width: size, height: size }}
        onClick={() => fileInputRef.current?.click()}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/60">
            <UserIcon className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilIcon className="h-5 w-5 text-white" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleAvatarChange}
      />
    </>
  );
}