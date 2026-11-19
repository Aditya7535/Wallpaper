/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { FormatBottomSheet } from "./components/FormatBottomSheet";
import { FullscreenLightbox } from "./components/FullscreenLightbox";
import { HistoryView, SavedView } from "./components/HistoryAndSavedViews";
import { StudioComposer } from "./components/StudioComposer";
import { TopBar } from "./components/TopBar";
import { WallpaperGrid } from "./components/WallpaperGrid";
import {
  getModelLabel,
  INITIAL_STARTER_BATCH,
  VARIATION_LABELS,
} from "./data/presets";
import type {
  AspectRatio,
  ImageModel,
  ImageSize,
  ReferenceContext,
  TabView,
  WallpaperBatch,
  WallpaperSlot,
} from "./types";
import {
  formatRelativeTime,
  urlToReferenceData,
  type InlineImagePayload,
} from "./utils/imageHelpers";
import {
  deleteHistoryBatch,
  loadHistoryBatches,
  loadSavedWallpapers,
  putHistoryBatch,
  putSavedWallpaper,
  removeSavedWallpaper,
} from "./utils/storage";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabView>("studio");
  const [vibe, setVibe] = useState("rainy cyberpunk lo-fi");
  const [remixNote, setRemixNote] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [imageSize, setImageSize] = useState<ImageSize>("2K");
  const [model, setModel] = useState<ImageModel>("gemini-3-pro-image-preview");
  const [reference, setReference] = useState<ReferenceContext | null>(null);
  const [mobileFormatOpen, setMobileFormatOpen] = useState(false);

  const [currentBatch, setCurrentBatch] = useState<WallpaperBatch>(
    INITIAL_STARTER_BATCH
  );
  const [historyBatches, setHistoryBatches] = useState<WallpaperBatch[]>([]);
  const [savedWallpapers, setSavedWallpapers] = useState<WallpaperSlot[]>([]);
  const [batchErrorBanner, setBatchErrorBanner] = useState<string | null>(null);

  // Lightbox viewer state
  const [lightboxSlots, setLightboxSlots] = useState<WallpaperSlot[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeRunIdRef = useRef<string | null>(null);

  // Hydrate persisted Saved & History from IndexedDB
  useEffect(() => {
    let mounted = true;
    Promise.all([loadSavedWallpapers(), loadHistoryBatches()]).then(
      ([saved, history]) => {
        if (!mounted) return;
        setSavedWallpapers(saved);
        setHistoryBatches(history);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const savedIds = useMemo(
    () => new Set(savedWallpapers.map((item) => item.id)),
    [savedWallpapers]
  );

  const isGenerating = useMemo(
    () => currentBatch.slots.some((slot) => slot.status === "loading"),
    [currentBatch.slots]
  );

  const handleToggleSave = useCallback((slot: WallpaperSlot) => {
    if (slot.status !== "ready" || !slot.imageUrl) return;
    setSavedWallpapers((prev) => {
      const exists = prev.some((item) => item.id === slot.id);
      if (exists) {
        void removeSavedWallpaper(slot.id);
        return prev.filter((item) => item.id !== slot.id);
      }
      void putSavedWallpaper(slot);
      return [slot, ...prev];
    });
  }, []);

  const requestSingleVariation = useCallback(
    async (params: {
      vibe: string;
      aspectRatio: AspectRatio;
      imageSize: ImageSize;
      model: ImageModel;
      variationIndex: number;
      remixNote?: string;
      referencePayload?: InlineImagePayload;
    }): Promise<
      | { ok: true; imageUrl: string; mimeType: string; variationLabel: string }
      | { ok: false; code: string; message: string }
    > => {
      try {
        const res = await fetch("/api/wallpapers/generate-one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vibe: params.vibe,
            aspectRatio: params.aspectRatio,
            imageSize: params.imageSize,
            model: params.model,
            variationIndex: params.variationIndex,
            remixNote: params.remixNote || undefined,
            referenceImage: params.referencePayload,
          }),
        });

        const data = (await res.json()) as {
          imageUrl?: string;
          mimeType?: string;
          variationLabel?: string;
          code?: string;
          message?: string;
        };

        if (!res.ok || !data.imageUrl) {
          return {
            ok: false,
            code: data.code || "GENERATION_FAILED",
            message:
              data.message || "Failed to generate this wallpaper variation.",
          };
        }

        return {
          ok: true,
          imageUrl: data.imageUrl,
          mimeType: data.mimeType || "image/png",
          variationLabel:
            data.variationLabel ||
            VARIATION_LABELS[params.variationIndex] ||
            `Variation ${params.variationIndex + 1}`,
        };
      } catch (err) {
        return {
          ok: false,
          code: "NETWORK_ERROR",
          message:
            err instanceof Error
              ? err.message
              : "Network error while contacting the generation server.",
        };
      }
    },
    []
  );

  const runBatchGeneration = useCallback(
    async (options: {
      promptVibe: string;
      targetAspectRatio: AspectRatio;
      targetImageSize: ImageSize;
      targetModel: ImageModel;
      refContext: ReferenceContext | null;
      note: string;
    }) => {
      const cleanVibe = options.promptVibe.trim();
      if (!cleanVibe) return;

      const batchId = createId("batch");
      activeRunIdRef.current = batchId;
      const createdAt = Date.now();
      const isRemix = Boolean(options.refContext);

      setActiveTab("studio");
      setBatchErrorBanner(null);

      const initialSlots: WallpaperSlot[] = [0, 1, 2, 3].map((idx) => ({
        id: createId(`wp-${idx}`),
        variationIndex: idx,
        variationLabel: VARIATION_LABELS[idx],
        status: "loading",
        vibe: cleanVibe,
        aspectRatio: options.targetAspectRatio,
        imageSize: options.targetImageSize,
        model: options.targetModel,
        createdAt,
        isRemix,
        remixNote: options.note || undefined,
        referenceThumbUrl: options.refContext?.imageUrl,
      }));

      const newBatch: WallpaperBatch = {
        id: batchId,
        vibe: cleanVibe,
        aspectRatio: options.targetAspectRatio,
        imageSize: options.targetImageSize,
        model: options.targetModel,
        createdAt,
        isRemix,
        remixNote: options.note || undefined,
        referenceThumbUrl: options.refContext?.imageUrl,
        slots: initialSlots,
      };

      setCurrentBatch(newBatch);

      let referencePayload: InlineImagePayload | undefined;
      if (options.refContext) {
        try {
          referencePayload = await urlToReferenceData(
            options.refContext.imageUrl
          );
        } catch {
          setBatchErrorBanner(
            "Could not encode the reference image for remixing. Please try another frame."
          );
          setCurrentBatch((prev) =>
            prev.id !== batchId
              ? prev
              : {
                  ...prev,
                  slots: prev.slots.map((s) => ({
                    ...s,
                    status: "error",
                    errorMessage: "Reference image preparation failed.",
                  })),
                }
          );
          return;
        }
      }

      const finalSlots = [...initialSlots];
      let firstCriticalError: string | null = null;
      let successCount = 0;

      await Promise.all(
        initialSlots.map(async (slot, idx) => {
          const result = await requestSingleVariation({
            vibe: cleanVibe,
            aspectRatio: options.targetAspectRatio,
            imageSize: options.targetImageSize,
            model: options.targetModel,
            variationIndex: idx,
            remixNote: options.note,
            referencePayload,
          });

          const updatedSlot: WallpaperSlot = result.ok
            ? {
                ...slot,
                status: "ready",
                imageUrl: result.imageUrl,
                mimeType: result.mimeType,
                variationLabel: result.variationLabel,
              }
            : {
                ...slot,
                status: "error",
                errorCode: result.code,
                errorMessage: result.message,
              };

          finalSlots[idx] = updatedSlot;
          if (result.ok) {
            successCount += 1;
          } else if (!firstCriticalError) {
            firstCriticalError = result.message;
          }

          if (activeRunIdRef.current === batchId) {
            setCurrentBatch((prev) =>
              prev.id !== batchId
                ? prev
                : {
                    ...prev,
                    slots: prev.slots.map((item) =>
                      item.id === slot.id ? updatedSlot : item
                    ),
                  }
            );
          }
        })
      );

      if (activeRunIdRef.current !== batchId) return;

      if (successCount === 0 && firstCriticalError) {
        setBatchErrorBanner(firstCriticalError);
      }

      if (successCount > 0) {
        const completedBatch: WallpaperBatch = {
          ...newBatch,
          slots: finalSlots,
        };
        setHistoryBatches((prev) => [completedBatch, ...prev]);
        void putHistoryBatch(completedBatch);
      }
    },
    [requestSingleVariation]
  );

  const handleGenerate = useCallback(() => {
    void runBatchGeneration({
      promptVibe: vibe,
      targetAspectRatio: aspectRatio,
      targetImageSize: imageSize,
      targetModel: model,
      refContext: reference,
      note: remixNote,
    });
  }, [vibe, aspectRatio, imageSize, model, reference, remixNote, runBatchGeneration]);

  const handleRetrySlot = useCallback(
    async (failedSlot: WallpaperSlot) => {
      const targetBatchId = currentBatch.id;
      setBatchErrorBanner(null);

      setCurrentBatch((prev) => ({
        ...prev,
        slots: prev.slots.map((s) =>
          s.id === failedSlot.id
            ? { ...s, status: "loading", errorMessage: undefined }
            : s
        ),
      }));

      let referencePayload: InlineImagePayload | undefined;
      if (failedSlot.referenceThumbUrl) {
        try {
          referencePayload = await urlToReferenceData(
            failedSlot.referenceThumbUrl
          );
        } catch {
          // Proceed without reference if unavailable
        }
      }

      const result = await requestSingleVariation({
        vibe: failedSlot.vibe,
        aspectRatio: failedSlot.aspectRatio,
        imageSize: failedSlot.imageSize,
        model: failedSlot.model,
        variationIndex: failedSlot.variationIndex,
        remixNote: failedSlot.remixNote,
        referencePayload,
      });

      const updatedSlot: WallpaperSlot = result.ok
        ? {
            ...failedSlot,
            status: "ready",
            imageUrl: result.imageUrl,
            mimeType: result.mimeType,
            variationLabel: result.variationLabel,
          }
        : {
            ...failedSlot,
            status: "error",
            errorCode: result.code,
            errorMessage: result.message,
          };

      if (!result.ok) {
        setBatchErrorBanner(result.message);
      }

      setCurrentBatch((prev) => {
        if (prev.id !== targetBatchId) return prev;
        const nextBatch = {
          ...prev,
          slots: prev.slots.map((s) =>
            s.id === failedSlot.id ? updatedSlot : s
          ),
        };
        if (result.ok && !nextBatch.isStarter) {
          setHistoryBatches((hist) => {
            const exists = hist.some((b) => b.id === nextBatch.id);
            const updatedHist = exists
              ? hist.map((b) => (b.id === nextBatch.id ? nextBatch : b))
              : [nextBatch, ...hist];
            return updatedHist;
          });
          void putHistoryBatch(nextBatch);
        }
        return nextBatch;
      });
    },
    [currentBatch.id, requestSingleVariation]
  );

  const handleRemixImmediate = useCallback(
    (sourceSlot: WallpaperSlot, nextVibe: string, nextNote: string) => {
      if (!sourceSlot.imageUrl) return;
      const nextRef: ReferenceContext = {
        sourceId: sourceSlot.id,
        imageUrl: sourceSlot.imageUrl,
        vibe: nextVibe,
        variationLabel: sourceSlot.variationLabel,
        aspectRatio: sourceSlot.aspectRatio,
      };
      setReference(nextRef);
      setVibe(nextVibe);
      setRemixNote(nextNote);

      void runBatchGeneration({
        promptVibe: nextVibe,
        targetAspectRatio: aspectRatio,
        targetImageSize: imageSize,
        targetModel: model,
        refContext: nextRef,
        note: nextNote,
      });
    },
    [aspectRatio, imageSize, model, runBatchGeneration]
  );

  const handleAttachToStudio = useCallback((sourceSlot: WallpaperSlot) => {
    if (!sourceSlot.imageUrl) return;
    setReference({
      sourceId: sourceSlot.id,
      imageUrl: sourceSlot.imageUrl,
      vibe: sourceSlot.vibe,
      variationLabel: sourceSlot.variationLabel,
      aspectRatio: sourceSlot.aspectRatio,
    });
    setVibe(sourceSlot.vibe);
    setRemixNote("");
    setActiveTab("studio");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  const handleNewVibe = useCallback(() => {
    setActiveTab("studio");
    setReference(null);
    setRemixNote("");
    setVibe("");
    setBatchErrorBanner(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  }, []);

  const handleOpenLightbox = useCallback(
    (slots: WallpaperSlot[], index: number) => {
      setLightboxSlots(slots);
      setLightboxIndex(index);
    },
    []
  );

  const handleLoadBatchToStudio = useCallback((batch: WallpaperBatch) => {
    setCurrentBatch(batch);
    setVibe(batch.vibe);
    setAspectRatio(batch.aspectRatio);
    setImageSize(batch.imageSize);
    setModel(batch.model);
    setRemixNote(batch.remixNote ?? "");
    setReference(null);
    setBatchErrorBanner(null);
    setActiveTab("studio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteBatch = useCallback((batchId: string) => {
    setHistoryBatches((prev) => prev.filter((b) => b.id !== batchId));
    void deleteHistoryBatch(batchId);
  }, []);

  const readyCurrentSlots = useMemo(
    () => currentBatch.slots.filter((s) => s.status === "ready" && s.imageUrl),
    [currentBatch.slots]
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[#09090B] text-zinc-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        savedCount={savedWallpapers.length}
        historyCount={historyBatches.length}
        aspectRatio={aspectRatio}
        imageSize={imageSize}
        onOpenFormatSheet={() => setMobileFormatOpen(true)}
        onNewVibe={handleNewVibe}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {activeTab === "studio" && (
          <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10">
            <StudioComposer
              vibe={vibe}
              onChangeVibe={setVibe}
              remixNote={remixNote}
              onChangeRemixNote={setRemixNote}
              reference={reference}
              onClearReference={() => {
                setReference(null);
                setRemixNote("");
              }}
              aspectRatio={aspectRatio}
              onChangeAspectRatio={setAspectRatio}
              imageSize={imageSize}
              onChangeImageSize={setImageSize}
              model={model}
              onChangeModel={setModel}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
              onOpenMobileFormat={() => setMobileFormatOpen(true)}
              textareaRef={textareaRef}
            />

            {/* Right Gallery Stage */}
            <section
              aria-label="Generated wallpaper variations"
              className="flex-1 w-full min-w-0 space-y-5"
            >
              {/* Batch Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-white/[0.08]">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>
                      {currentBatch.isStarter
                        ? "Curated Starter Set"
                        : currentBatch.isRemix
                          ? "Remixed Batch"
                          : "Latest Batch"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-zinc-300">
                      {currentBatch.aspectRatio}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-zinc-300">
                      {currentBatch.imageSize}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{getModelLabel(currentBatch.model)}</span>
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-semibold text-zinc-100 truncate">
                    “{currentBatch.vibe}”
                  </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-500">
                  {currentBatch.referenceThumbUrl && (
                    <div className="flex items-center gap-1.5 text-amber-300/90">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>From reference</span>
                    </div>
                  )}
                  <span>
                    {currentBatch.isStarter
                      ? "Tap any frame to preview or remix"
                      : formatRelativeTime(currentBatch.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actionable Error Notice (if API key / billing / quota error occurred) */}
              {batchErrorBanner && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-400/30 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-amber-100">
                      Generation paused
                    </p>
                    <p className="text-zinc-300 text-xs leading-relaxed">
                      {batchErrorBanner}
                    </p>
                  </div>
                </div>
              )}

              {/* 4-Variation Responsive Grid */}
              <WallpaperGrid
                slots={currentBatch.slots}
                aspectRatio={currentBatch.aspectRatio}
                savedIds={savedIds}
                onSelectSlot={(clicked) => {
                  const idx = readyCurrentSlots.findIndex(
                    (s) => s.id === clicked.id
                  );
                  if (idx >= 0) handleOpenLightbox(readyCurrentSlots, idx);
                }}
                onToggleSave={handleToggleSave}
                onRetrySlot={handleRetrySlot}
              />
            </section>
          </div>
        )}

        {activeTab === "history" && (
          <HistoryView
            batches={historyBatches}
            savedIds={savedIds}
            onOpenSlot={handleOpenLightbox}
            onToggleSave={handleToggleSave}
            onLoadBatchToStudio={handleLoadBatchToStudio}
            onDeleteBatch={handleDeleteBatch}
            onReturnStudio={() => setActiveTab("studio")}
          />
        )}

        {activeTab === "saved" && (
          <SavedView
            savedWallpapers={savedWallpapers}
            savedIds={savedIds}
            onOpenSlot={handleOpenLightbox}
            onToggleSave={handleToggleSave}
            onReturnStudio={() => setActiveTab("studio")}
          />
        )}
      </main>

      {/* Mobile Format Sheet */}
      <FormatBottomSheet
        open={mobileFormatOpen}
        onClose={() => setMobileFormatOpen(false)}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={setAspectRatio}
        imageSize={imageSize}
        onChangeImageSize={setImageSize}
        model={model}
        onChangeModel={setModel}
      />

      {/* Fullscreen Lightbox Viewer with Download, Lock Screen Preview & Remix */}
      <FullscreenLightbox
        slots={lightboxSlots}
        activeIndex={lightboxIndex}
        savedIds={savedIds}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
        onToggleSave={handleToggleSave}
        onRemixImmediate={handleRemixImmediate}
        onAttachToStudio={handleAttachToStudio}
      />
    </div>
  );
}
