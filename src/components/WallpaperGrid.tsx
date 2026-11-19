import { useState } from "react";
import { AlertCircle, Bookmark, ImageOff, RefreshCw } from "lucide-react";
import { getAspectOption } from "../data/presets";
import type { AspectRatio, WallpaperSlot } from "../types";

interface WallpaperGridProps {
  slots: WallpaperSlot[];
  aspectRatio: AspectRatio;
  savedIds: Set<string>;
  onSelectSlot: (slot: WallpaperSlot) => void;
  onToggleSave: (slot: WallpaperSlot) => void;
  onRetrySlot?: (slot: WallpaperSlot) => void;
}

function WallpaperCard({
  slot,
  cssAspect,
  isSaved,
  onSelect,
  onToggleSave,
  onRetry,
}: {
  slot: WallpaperSlot;
  cssAspect: string;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
  onRetry?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const frameNumber = String(slot.variationIndex + 1).padStart(2, "0");

  if (slot.status === "loading") {
    return (
      <div
        className={`relative ${cssAspect} rounded-2xl bg-[#131316] border border-white/[0.08] overflow-hidden shimmer-bar flex flex-col justify-between p-4`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-500">
          <span>{frameNumber}</span>
          <span>{slot.imageSize}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-300">
            {slot.variationLabel}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {slot.isRemix ? "Remixing from reference..." : "Rendering frame..."}
          </p>
        </div>
      </div>
    );
  }

  if (slot.status === "error" || !slot.imageUrl) {
    return (
      <div
        className={`relative ${cssAspect} rounded-2xl bg-[#141418] border border-white/[0.08] overflow-hidden flex flex-col justify-between p-4`}
      >
        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-500">
          <span>{frameNumber}</span>
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-zinc-200">
              Frame unavailable
            </p>
            <p className="text-[11px] leading-relaxed text-zinc-400 mt-1 line-clamp-4">
              {slot.errorMessage || "Unable to render this variation."}
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-zinc-100 inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative ${cssAspect} rounded-2xl bg-[#131316] border border-white/[0.08] overflow-hidden transition-colors duration-200 hover:border-white/25`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Open ${slot.variationLabel} wallpaper full screen`}
        className="w-full h-full block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset"
      >
        {imgFailed ? (
          <div className="w-full h-full bg-gradient-to-br from-[#18181D] via-[#121216] to-[#0B0B0E] flex flex-col items-center justify-center p-4 text-center">
            <ImageOff className="w-6 h-6 text-zinc-500 mb-2" />
            <span className="text-xs font-medium text-zinc-300">
              {slot.variationLabel}
            </span>
          </div>
        ) : (
          <img
            src={slot.imageUrl}
            alt={`${slot.vibe} — ${slot.variationLabel} wallpaper`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
          />
        )}

        {/* Measured bottom scrim for legibility */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/35 to-transparent opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-200">
              <span className="font-mono tabular-nums text-zinc-400">
                {frameNumber}
              </span>
              <span aria-hidden="true" className="text-zinc-500">
                ·
              </span>
              <span className="truncate font-medium">
                {slot.variationLabel}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Quick Save button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave();
        }}
        aria-label={isSaved ? "Remove from saved wallpapers" : "Save wallpaper"}
        aria-pressed={isSaved}
        className={`absolute top-2 right-2 min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center backdrop-blur-md transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 ${
          isSaved
            ? "bg-zinc-100 text-zinc-950"
            : "bg-black/45 text-zinc-200 border border-white/15 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-black/70"
        }`}
      >
        <Bookmark
          className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`}
        />
      </button>
    </div>
  );
}

export function WallpaperGrid({
  slots,
  aspectRatio,
  savedIds,
  onSelectSlot,
  onToggleSave,
  onRetrySlot,
}: WallpaperGridProps) {
  const aspectOpt = getAspectOption(aspectRatio);
  const gridCols = aspectOpt.isVertical
    ? "grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
    : "grid-cols-1 sm:grid-cols-2 gap-4";

  return (
    <div className={`grid ${gridCols}`}>
      {slots.map((slot) => {
        const slotAspect = getAspectOption(slot.aspectRatio).cssAspect;
        return (
          <WallpaperCard
            key={slot.id}
            slot={slot}
            cssAspect={slotAspect}
            isSaved={savedIds.has(slot.id)}
            onSelect={() => onSelectSlot(slot)}
            onToggleSave={() => onToggleSave(slot)}
            onRetry={onRetrySlot ? () => onRetrySlot(slot) : undefined}
          />
        );
      })}
    </div>
  );
}
