export type AspectRatio =
  | "9:16"
  | "2:3"
  | "3:4"
  | "1:1"
  | "4:3"
  | "3:2"
  | "16:9"
  | "21:9";

export type ImageSize = "1K" | "2K" | "4K";

export type ImageModel =
  | "gemini-3-pro-image-preview"
  | "gemini-nano-banana-2.1";

export type TabView = "studio" | "history" | "saved";

export type SlotStatus = "loading" | "ready" | "error";

export interface WallpaperSlot {
  id: string;
  variationIndex: number;
  variationLabel: string;
  status: SlotStatus;
  imageUrl?: string;
  mimeType?: string;
  vibe: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: ImageModel;
  createdAt: number;
  isRemix: boolean;
  remixNote?: string;
  referenceThumbUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface WallpaperBatch {
  id: string;
  vibe: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  model: ImageModel;
  createdAt: number;
  isStarter?: boolean;
  isRemix: boolean;
  remixNote?: string;
  referenceThumbUrl?: string;
  slots: WallpaperSlot[];
}

export interface ReferenceContext {
  sourceId: string;
  imageUrl: string;
  vibe: string;
  variationLabel: string;
  aspectRatio: AspectRatio;
}
