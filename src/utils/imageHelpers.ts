import type { WallpaperSlot } from "../types";

export interface InlineImagePayload {
  data: string;
  mimeType: string;
}

/**
 * Converts a data URI or local asset URL into a compact base64 payload suitable
 * for sending as a visual reference when remixing.
 */
export async function urlToReferenceData(
  imageUrl: string
): Promise<InlineImagePayload> {
  const img = await loadImage(imageUrl);
  const maxDim = 1280;
  let width = img.naturalWidth || 720;
  let height = img.naturalHeight || 1280;

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Fallback to raw data URI parsing if canvas is unavailable
    if (imageUrl.startsWith("data:")) {
      const [header, base64] = imageUrl.split(",");
      const match = header.match(/data:(.*?);base64/);
      return {
        data: base64 || "",
        mimeType: match?.[1] || "image/jpeg",
      };
    }
    throw new Error("Could not prepare reference image.");
  }

  ctx.drawImage(img, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const [, base64] = dataUrl.split(",");

  return {
    data: base64,
    mimeType: "image/jpeg",
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load reference image."));
    img.src = src;
  });
}

export async function downloadWallpaper(slot: WallpaperSlot): Promise<void> {
  if (!slot.imageUrl) return;

  const slug = slot.vibe
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);
  const ratioSlug = slot.aspectRatio.replace(":", "x");
  const isPng =
    slot.mimeType === "image/png" || slot.imageUrl.startsWith("data:image/png");
  const ext = isPng ? "png" : "jpg";
  const filename = `vibeframe-${slug || "wallpaper"}-${ratioSlug}-${slot.imageSize.toLowerCase()}.${ext}`;

  try {
    const response = await fetch(slot.imageUrl);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch {
    const link = document.createElement("a");
    link.href = slot.imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
