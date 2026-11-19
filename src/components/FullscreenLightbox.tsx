import { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Flashlight,
  Camera,
  RefreshCw,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getModelLabel, REMIX_TWEAKS } from "../data/presets";
import type { WallpaperSlot } from "../types";
import { downloadWallpaper } from "../utils/imageHelpers";

interface FullscreenLightboxProps {
  slots: WallpaperSlot[];
  activeIndex: number | null;
  savedIds: Set<string>;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onToggleSave: (slot: WallpaperSlot) => void;
  onRemixImmediate: (slot: WallpaperSlot, vibe: string, remixNote: string) => void;
  onAttachToStudio: (slot: WallpaperSlot) => void;
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  const timeStr = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });
  const dateStr = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return { timeStr, dateStr };
}

export function FullscreenLightbox({
  slots,
  activeIndex,
  savedIds,
  onClose,
  onNavigate,
  onToggleSave,
  onRemixImmediate,
  onAttachToStudio,
}: FullscreenLightboxProps) {
  const isOpen = activeIndex !== null && Boolean(slots[activeIndex]);
  const slot = isOpen && activeIndex !== null ? slots[activeIndex] : null;

  const [showLockPreview, setShowLockPreview] = useState(false);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixVibe, setRemixVibe] = useState("");
  const [remixNote, setRemixNote] = useState("");
  const { timeStr, dateStr } = useLiveClock();

  useEffect(() => {
    if (!slot) {
      setRemixOpen(false);
      setShowLockPreview(false);
      return;
    }
    setRemixVibe(slot.vibe);
    setRemixNote("");
  }, [slot?.id]);

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (remixOpen) {
          setRemixOpen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft" && !remixOpen && activeIndex > 0) {
        onNavigate(activeIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        !remixOpen &&
        activeIndex < slots.length - 1
      ) {
        onNavigate(activeIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeIndex, slots.length, remixOpen, onClose, onNavigate]);

  const handleDownload = async () => {
    if (!slot) return;
    await downloadWallpaper(slot);
    setDownloadedId(slot.id);
    setTimeout(() => {
      setDownloadedId((current) => (current === slot.id ? null : current));
    }, 2000);
  };

  const handleSubmitRemix = () => {
    if (!slot) return;
    const finalVibe = remixVibe.trim() || slot.vibe;
    onRemixImmediate(slot, finalVibe, remixNote.trim());
    setRemixOpen(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && slot && activeIndex !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen wallpaper preview"
          className="fixed inset-0 z-50 bg-[#050507]/96 backdrop-blur-xl flex flex-col"
        >
          {/* Top Bar */}
          <div className="shrink-0 h-14 px-3 sm:px-6 flex items-center justify-between gap-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close full screen preview"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.07] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
                <span className="font-mono tabular-nums text-zinc-200">
                  {String(activeIndex + 1).padStart(2, "0")} /{" "}
                  {String(slots.length).padStart(2, "0")}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {slot.aspectRatio}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{slot.imageSize}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline">
                  {getModelLabel(slot.model)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowLockPreview((prev) => !prev)}
                aria-pressed={showLockPreview}
                className={`min-h-[44px] px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  showLockPreview
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Lock Screen</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSave(slot)}
                aria-label={
                  savedIds.has(slot.id)
                    ? "Remove from saved"
                    : "Save wallpaper"
                }
                aria-pressed={savedIds.has(slot.id)}
                className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  savedIds.has(slot.id)
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-300 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    savedIds.has(slot.id) ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-4 py-4 sm:px-14">
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => onNavigate(activeIndex - 1)}
                aria-label="Previous variation"
                className="absolute left-2 sm:left-5 z-20 min-h-[44px] min-w-[44px] rounded-full bg-black/55 border border-white/15 text-zinc-200 hover:bg-black/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 max-h-[calc(100dvh-196px)] flex items-center justify-center">
                <img
                  src={slot.imageUrl}
                  alt={`${slot.vibe} — ${slot.variationLabel}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[calc(100dvh-196px)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-9rem)] w-auto h-auto object-contain block"
                />

                {/* Optional Lock Screen Clock Overlay */}
                {showLockPreview && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-b from-black/35 via-transparent to-black/45"
                  >
                    <div className="pt-5 text-center select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                      <p className="text-xs sm:text-sm font-medium text-white/90 tracking-wide">
                        {dateStr}
                      </p>
                      <p className="font-display text-5xl sm:text-6xl font-semibold text-white/95 tracking-tight tabular-nums mt-0.5 leading-none">
                        {timeStr}
                      </p>
                    </div>

                    <div className="flex items-center justify-between px-2 pb-2">
                      <span className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90">
                        <Flashlight className="w-4 h-4" />
                      </span>
                      <span className="w-24 h-1 rounded-full bg-white/75" />
                      <span className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90">
                        <Camera className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {activeIndex < slots.length - 1 && (
              <button
                type="button"
                onClick={() => onNavigate(activeIndex + 1)}
                aria-label="Next variation"
                className="absolute right-2 sm:right-5 z-20 min-h-[44px] min-w-[44px] rounded-full bg-black/55 border border-white/15 text-zinc-200 hover:bg-black/80 hover:text-white flex items-center justify-center backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Bottom Action Dock */}
          <div className="shrink-0 px-4 pt-3 pb-safe border-t border-white/[0.06] bg-[#09090B]/95">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                <span className="truncate text-zinc-200 font-medium">
                  {slot.vibe}
                </span>
                <span className="shrink-0 text-zinc-500">
                  {slot.variationLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="min-h-[48px] px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                >
                  {downloadedId === slot.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRemixOpen(true)}
                  className="min-h-[48px] px-4 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-100 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                >
                  <RefreshCw className="w-4 h-4 text-amber-300" />
                  <span>Remix</span>
                </button>
              </div>
            </div>
          </div>

          {/* Inline Remix Drawer inside Lightbox */}
          <AnimatePresence>
            {remixOpen && (
              <div className="fixed inset-0 z-30 flex flex-col justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setRemixOpen(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                />

                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-full max-w-xl mx-auto rounded-t-3xl bg-[#131316] border-t border-x border-white/10 p-5 pb-safe shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={slot.imageUrl}
                        alt="Reference preview"
                        referrerPolicy="no-referrer"
                        className="w-10 h-14 rounded-lg object-cover border border-white/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-zinc-50">
                          Remix This Wallpaper
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">
                          Used as visual reference for 4 new variations
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemixOpen(false)}
                      aria-label="Cancel remix"
                      className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="lightbox-remix-vibe"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Vibe Prompt
                    </label>
                    <input
                      id="lightbox-remix-vibe"
                      type="text"
                      value={remixVibe}
                      onChange={(e) => setRemixVibe(e.target.value)}
                      placeholder="Describe the vibe..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0C0C0F] border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="lightbox-remix-note"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Optional Direction
                    </label>
                    <input
                      id="lightbox-remix-note"
                      type="text"
                      value={remixNote}
                      onChange={(e) => setRemixNote(e.target.value)}
                      placeholder="e.g., warmer dusk light, calmer upper sky..."
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#0C0C0F] border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {REMIX_TWEAKS.map((tweak) => {
                        const selected = remixNote === tweak;
                        return (
                          <button
                            key={tweak}
                            type="button"
                            onClick={() =>
                              setRemixNote(selected ? "" : tweak)
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                              selected
                                ? "bg-amber-400/20 border-amber-400/50 text-amber-100"
                                : "bg-[#1A1A1F] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {tweak}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleSubmitRemix}
                      className="flex-1 min-h-[48px] px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate 4 Remixes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAttachToStudio(slot);
                        setRemixOpen(false);
                        onClose();
                      }}
                      className="min-h-[48px] px-4 rounded-xl bg-[#1A1A20] hover:bg-[#23232B] border border-white/10 text-zinc-200 text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Edit Format</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
