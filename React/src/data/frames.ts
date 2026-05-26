import { supabase } from "../lib/supabaseClient";

export type FrameAsset = {
  id: string;
  imageUrl: string;
};

const FRAMES_BUCKET = "frames";

const KNOWN_FRAME_FILES = [
  "frame_01.png",
  "frame_02.png",
  "frame_03.png",
  "frame_04.png",
  "frame_05.png",
  "frame_06.png",
];

export function resolveFrameImage(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  const { data } = supabase.storage.from(FRAMES_BUCKET).getPublicUrl(imagePath);
  return data?.publicUrl ?? null;
}

export const ALL_FRAME_IDS = KNOWN_FRAME_FILES;
