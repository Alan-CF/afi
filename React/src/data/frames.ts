import frame01 from "../frames/frame_01.png";
import frame02 from "../frames/frame_02.png";
import frame03 from "../frames/frame_03.png";
import frame04 from "../frames/frame_04.png";
import frame05 from "../frames/frame_05.png";
import frame06 from "../frames/frame_06.png";

export type FrameAsset = {
  id: string;
  imageUrl: string;
};

/**
 * Maps every PNG in src/frames to a bundled URL. The DB row's image_path is the
 * filename — we resolve it here so the frame catalog stays consistent regardless
 * of which environment the assets are served from.
 */
const FRAME_FILES: Record<string, string> = {
  "frame_01.png": frame01,
  "frame_02.png": frame02,
  "frame_03.png": frame03,
  "frame_04.png": frame04,
  "frame_05.png": frame05,
  "frame_06.png": frame06,
};

export function resolveFrameImage(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return FRAME_FILES[imagePath] ?? null;
}

export const ALL_FRAME_IDS = Object.keys(FRAME_FILES);
