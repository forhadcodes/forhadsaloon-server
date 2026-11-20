import multer from "multer";

import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Memory storage: the buffer is streamed straight to ImgBB, nothing is written
 * to the serverless filesystem.
 */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(400, "Only JPEG, PNG or WebP images are allowed"));
      return;
    }
    callback(null, true);
  },
});

type ImgbbResponse = {
  success?: boolean;
  data?: {
    url?: string;
    display_url?: string;
    thumb?: { url?: string };
  };
  error?: { message?: string };
};

export type UploadedImage = {
  url: string;
  thumbnailUrl: string;
};

/** Uploads a validated image buffer to ImgBB using the server-only API key. */
export const uploadToImgbb = async (file: Express.Multer.File): Promise<UploadedImage> => {
  const form = new FormData();
  form.append(
    "image",
    new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
    file.originalname || "image",
  );

  let response: Response;
  try {
    response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`,
      { method: "POST", body: form, signal: AbortSignal.timeout(20000) },
    );
  } catch {
    throw new ApiError(502, "Image hosting service is unreachable. Please try again.");
  }

  const payload = (await response.json().catch(() => null)) as ImgbbResponse | null;
  const url = payload?.data?.url;

  if (!response.ok || !payload?.success || !url) {
    throw new ApiError(
      502,
      payload?.error?.message
        ? `Image upload failed: ${payload.error.message}`
        : "Image upload failed. Please try again.",
    );
  }

  return { url, thumbnailUrl: payload.data?.thumb?.url ?? url };
};
