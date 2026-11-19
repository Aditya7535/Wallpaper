import type {
  AspectRatio,
  ImageModel,
  ImageSize,
  WallpaperBatch,
} from "../types";

export interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  caption: string;
  widthRatio: number;
  heightRatio: number;
  cssAspect: string;
  isVertical: boolean;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  {
    value: "9:16",
    label: "9:16",
    caption: "Phone",
    widthRatio: 9,
    heightRatio: 16,
    cssAspect: "aspect-[9/16]",
    isVertical: true,
  },
  {
    value: "2:3",
    label: "2:3",
    caption: "Classic Portrait",
    widthRatio: 2,
    heightRatio: 3,
    cssAspect: "aspect-[2/3]",
    isVertical: true,
  },
  {
    value: "3:4",
    label: "3:4",
    caption: "Tablet Portrait",
    widthRatio: 3,
    heightRatio: 4,
    cssAspect: "aspect-[3/4]",
    isVertical: true,
  },
  {
    value: "1:1",
    label: "1:1",
    caption: "Square",
    widthRatio: 1,
    heightRatio: 1,
    cssAspect: "aspect-square",
    isVertical: false,
  },
  {
    value: "4:3",
    label: "4:3",
    caption: "Tablet",
    widthRatio: 4,
    heightRatio: 3,
    cssAspect: "aspect-[4/3]",
    isVertical: false,
  },
  {
    value: "3:2",
    label: "3:2",
    caption: "Camera",
    widthRatio: 3,
    heightRatio: 2,
    cssAspect: "aspect-[3/2]",
    isVertical: false,
  },
  {
    value: "16:9",
    label: "16:9",
    caption: "Desktop",
    widthRatio: 16,
    heightRatio: 9,
    cssAspect: "aspect-video",
    isVertical: false,
  },
  {
    value: "21:9",
    label: "21:9",
    caption: "Ultrawide",
    widthRatio: 21,
    heightRatio: 9,
    cssAspect: "aspect-[21/9]",
    isVertical: false,
  },
];

export const IMAGE_SIZE_OPTIONS: Array<{
  value: ImageSize;
  label: string;
  detail: string;
}> = [
  { value: "1K", label: "1K", detail: "Fast preview" },
  { value: "2K", label: "2K", detail: "Crisp retina" },
  { value: "4K", label: "4K", detail: "Ultra sharp" },
];

export const MODEL_OPTIONS: Array<{
  value: ImageModel;
  label: string;
  shortLabel: string;
  detail: string;
}> = [
  {
    value: "gemini-3-pro-image-preview",
    label: "Studio Pro",
    shortLabel: "Studio Pro",
    detail: "High-craft lighting & 4K fidelity",
  },
  {
    value: "gemini-nano-banana-2.1",
    label: "Nano Banana 2.1",
    shortLabel: "Nano 2.1",
    detail: "Rapid multi-ratio generation",
  },
];

export const VIBE_PRESETS: string[] = [
  "rainy cyberpunk lo-fi",
  "brutalist concrete desert at golden dusk",
  "quiet kyoto cedar forest in silver mist",
  "dark obsidian liquid glass reflections",
  "midnight alpine observatory under clear stars",
  "warm terracotta mediterranean shadows at noon",
];

export const REMIX_TWEAKS: string[] = [
  "warmer golden hour lighting",
  "deeper midnight shadows",
  "minimalist with more open sky",
  "softer atmospheric fog",
  "richer film grain texture",
  "cooler twilight slate tones",
];

export const VARIATION_LABELS = [
  "Wide Atmospheric",
  "Intimate Texture",
  "Architectural Light",
  "Minimalist Horizon",
];

export function getAspectOption(ratio: AspectRatio): AspectRatioOption {
  return (
    ASPECT_RATIO_OPTIONS.find((item) => item.value === ratio) ??
    ASPECT_RATIO_OPTIONS[0]
  );
}

export function getModelLabel(model: ImageModel): string {
  return (
    MODEL_OPTIONS.find((item) => item.value === model)?.shortLabel ??
    "Studio Pro"
  );
}

const STARTER_CREATED_AT = Date.now() - 1000 * 60 * 4;

export const INITIAL_STARTER_BATCH: WallpaperBatch = {
  id: "starter-rainy-lofi",
  vibe: "rainy cyberpunk lo-fi",
  aspectRatio: "9:16",
  imageSize: "2K",
  model: "gemini-3-pro-image-preview",
  createdAt: STARTER_CREATED_AT,
  isStarter: true,
  isRemix: false,
  slots: [
    {
      id: "starter-slot-0",
      variationIndex: 0,
      variationLabel: "Wide Atmospheric",
      status: "ready",
      imageUrl: "/src/assets/images/lofi_rain_alley_1795073543639.jpg",
      mimeType: "image/jpeg",
      vibe: "rainy cyberpunk lo-fi",
      aspectRatio: "9:16",
      imageSize: "2K",
      model: "gemini-3-pro-image-preview",
      createdAt: STARTER_CREATED_AT,
      isRemix: false,
    },
    {
      id: "starter-slot-1",
      variationIndex: 1,
      variationLabel: "Intimate Texture",
      status: "ready",
      imageUrl: "/src/assets/images/lofi_rain_window_1795073545144.jpg",
      mimeType: "image/jpeg",
      vibe: "rainy cyberpunk lo-fi",
      aspectRatio: "9:16",
      imageSize: "2K",
      model: "gemini-3-pro-image-preview",
      createdAt: STARTER_CREATED_AT,
      isRemix: false,
    },
    {
      id: "starter-slot-2",
      variationIndex: 2,
      variationLabel: "Architectural Light",
      status: "ready",
      imageUrl: "/src/assets/images/lofi_rain_train_1795073543553.jpg",
      mimeType: "image/jpeg",
      vibe: "rainy cyberpunk lo-fi",
      aspectRatio: "9:16",
      imageSize: "2K",
      model: "gemini-3-pro-image-preview",
      createdAt: STARTER_CREATED_AT,
      isRemix: false,
    },
    {
      id: "starter-slot-3",
      variationIndex: 3,
      variationLabel: "Minimalist Horizon",
      status: "ready",
      imageUrl: "/src/assets/images/lofi_rain_rooftop_1795073548529.jpg",
      mimeType: "image/jpeg",
      vibe: "rainy cyberpunk lo-fi",
      aspectRatio: "9:16",
      imageSize: "2K",
      model: "gemini-3-pro-image-preview",
      createdAt: STARTER_CREATED_AT,
      isRemix: false,
    },
  ],
};
