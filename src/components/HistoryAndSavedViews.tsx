import { Bookmark, Clock, Trash2, ArrowUpRight } from "lucide-react";
import { getModelLabel } from "../data/presets";
import type { WallpaperBatch, WallpaperSlot } from "../types";
import { formatRelativeTime } from "../utils/imageHelpers";
import { WallpaperGrid } from "./WallpaperGrid";

interface HistoryViewProps {
  batches: WallpaperBatch[];
  savedIds: Set<string>;
  onOpenSlot: (slots: WallpaperSlot[], index: number) => void;
  onToggleSave: (slot: WallpaperSlot) => void;
  onLoadBatchToStudio: (batch: WallpaperBatch) => void;
  onDeleteBatch: (batchId: string) => void;
  onReturnStudio: () => void;
}

export function HistoryView({
  batches,
  savedIds,
  onOpenSlot,
  onToggleSave,
  onLoadBatchToStudio,
  onDeleteBatch,
  onReturnStudio,
}: HistoryViewProps) {
  if (batches.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#141418] border border-white/[0.08] flex items-center justify-center text-zinc-400">
          <Clock className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold text-zinc-100">
            No generated batches yet
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every batch of 4 wallpapers you generate or remix is stored locally
            here so you can revisit and iterate anytime.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnStudio}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors"
        >
          Open Studio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
            Generation History
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tap any wallpaper to preview full screen, download, or start a remix.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-zinc-500">
          {batches.length} {batches.length === 1 ? "batch" : "batches"}
        </span>
      </div>

      <div className="space-y-12">
        {batches.map((batch) => {
          const readySlots = batch.slots.filter(
            (s) => s.status === "ready" && s.imageUrl
          );
          return (
            <section
              key={batch.id}
              className="space-y-4 pb-10 border-b border-white/[0.06] last:border-b-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-zinc-100 truncate">
                      {batch.vibe}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span className="font-mono tabular-nums text-zinc-300">
                      {batch.aspectRatio}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-zinc-300">
                      {batch.imageSize}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getModelLabel(batch.model)}</span>
                    {batch.isRemix && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300/90">Remix</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{formatRelativeTime(batch.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadBatchToStudio(batch)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-[#16161B] hover:bg-[#1F1F26] border border-white/10 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <span>Open in Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBatch(batch.id)}
                    aria-label={`Delete batch ${batch.vibe}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl bg-[#16161B] hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-zinc-400 hover:text-red-300 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <WallpaperGrid
                slots={batch.slots}
                aspectRatio={batch.aspectRatio}
                savedIds={savedIds}
                onSelectSlot={(clicked) => {
                  const idx = readySlots.findIndex((s) => s.id === clicked.id);
                  if (idx >= 0) onOpenSlot(readySlots, idx);
                }}
                onToggleSave={onToggleSave}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

interface SavedViewProps {
  savedWallpapers: WallpaperSlot[];
  savedIds: Set<string>;
  onOpenSlot: (slots: WallpaperSlot[], index: number) => void;
  onToggleSave: (slot: WallpaperSlot) => void;
  onReturnStudio: () => void;
}

export function SavedView({
  savedWallpapers,
  savedIds,
  onOpenSlot,
  onToggleSave,
  onReturnStudio,
}: SavedViewProps) {
  if (savedWallpapers.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#141418] border border-white/[0.08] flex items-center justify-center text-zinc-400">
          <Bookmark className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-display text-xl font-semibold text-zinc-100">
            No saved wallpapers yet
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Bookmark your favorite variations from the Studio or full-screen
            viewer to build your personal lock-screen collection.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnStudio}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white transition-colors"
        >
          Browse Studio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
            Saved Wallpapers
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tap any frame to test lock-screen alignment, download, or remix.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-zinc-500">
          {savedWallpapers.length}{" "}
          {savedWallpapers.length === 1 ? "wallpaper" : "wallpapers"}
        </span>
      </div>

      <WallpaperGrid
        slots={savedWallpapers}
        aspectRatio="9:16"
        savedIds={savedIds}
        onSelectSlot={(clicked) => {
          const idx = savedWallpapers.findIndex((s) => s.id === clicked.id);
          if (idx >= 0) onOpenSlot(savedWallpapers, idx);
        }}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}
