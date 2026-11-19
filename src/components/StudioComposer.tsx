import type { RefObject } from "react";
import {
  ArrowRight,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  getModelLabel,
  REMIX_TWEAKS,
  VIBE_PRESETS,
} from "../data/presets";
import type {
  AspectRatio,
  ImageModel,
  ImageSize,
  ReferenceContext,
} from "../types";
import { FormatControls } from "./FormatControls";

interface StudioComposerProps {
  vibe: string;
  onChangeVibe: (val: string) => void;
  remixNote: string;
  onChangeRemixNote: (val: string) => void;
  reference: ReferenceContext | null;
  onClearReference: () => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  imageSize: ImageSize;
  onChangeImageSize: (size: ImageSize) => void;
  model: ImageModel;
  onChangeModel: (model: ImageModel) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  onOpenMobileFormat: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function StudioComposer({
  vibe,
  onChangeVibe,
  remixNote,
  onChangeRemixNote,
  reference,
  onClearReference,
  aspectRatio,
  onChangeAspectRatio,
  imageSize,
  onChangeImageSize,
  model,
  onChangeModel,
  isGenerating,
  onGenerate,
  onOpenMobileFormat,
  textareaRef,
}: StudioComposerProps) {
  const canGenerate = vibe.trim().length > 0 && !isGenerating;

  return (
    <aside className="w-full lg:w-[356px] xl:w-[380px] shrink-0 lg:sticky lg:top-20 space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-zinc-50 leading-tight">
            {reference ? "Remix your frame" : "Describe your vibe"}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {reference
              ? "Generate 4 new variations guided by your selected reference image."
              : "Enter a mood, scene, or texture to craft 4 tailored wallpaper variations."}
          </p>
        </div>

        {/* Active Reference Attachment */}
        {reference && (
          <div className="p-3 rounded-2xl bg-[#141418] border border-amber-400/35 flex items-center gap-3">
            <img
              src={reference.imageUrl}
              alt="Active remix reference"
              referrerPolicy="no-referrer"
              className="w-11 h-16 rounded-lg object-cover border border-white/15 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-200">
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Reference attached</span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {reference.variationLabel} · {reference.aspectRatio}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearReference}
              aria-label="Remove remix reference"
              className="min-h-[44px] min-w-[44px] -mr-1 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Prompt Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canGenerate) onGenerate();
          }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <label htmlFor="vibe-prompt" className="sr-only">
              Describe your desired wallpaper vibe
            </label>
            <textarea
              ref={textareaRef}
              id="vibe-prompt"
              rows={3}
              value={vibe}
              onChange={(e) => onChangeVibe(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canGenerate) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
              placeholder="e.g., rainy cyberpunk lo-fi, warm lantern glow on wet cobblestones..."
              className="w-full px-4 py-3.5 rounded-2xl bg-[#131316] border border-white/10 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:border-amber-400/60 transition-colors"
            />

            {reference && (
              <div className="space-y-2">
                <label
                  htmlFor="studio-remix-note"
                  className="block text-xs font-medium text-zinc-400"
                >
                  Remix direction (optional)
                </label>
                <input
                  id="studio-remix-note"
                  type="text"
                  value={remixNote}
                  onChange={(e) => onChangeRemixNote(e.target.value)}
                  placeholder="e.g., warmer lighting, cleaner upper sky..."
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#131316] border border-white/10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/60 transition-colors"
                />
                <div className="flex flex-wrap gap-1.5">
                  {REMIX_TWEAKS.slice(0, 4).map((tweak) => {
                    const active = remixNote === tweak;
                    return (
                      <button
                        key={tweak}
                        type="button"
                        onClick={() => onChangeRemixNote(active ? "" : tweak)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${
                          active
                            ? "bg-amber-400/20 border-amber-400/45 text-amber-100"
                            : "bg-[#151519] border-white/[0.08] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tweak}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mobile compact format trigger bar */}
          <div className="lg:hidden flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#131316] border border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0 truncate">
              <span className="font-mono tabular-nums text-zinc-200">
                {aspectRatio}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-zinc-200">
                {imageSize}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{getModelLabel(model)}</span>
            </div>
            <button
              type="button"
              onClick={onOpenMobileFormat}
              className="min-h-[36px] px-2.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Format</span>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={!canGenerate}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating 4 Variations...</span>
              </>
            ) : reference ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Remix 4 Variations</span>
              </>
            ) : (
              <>
                <span>Generate 4 Variations</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Vibe Starters */}
        {!reference && (
          <div className="pt-1">
            <p className="text-xs text-zinc-500 mb-2">Try a vibe</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-wrap pb-1">
              {VIBE_PRESETS.map((preset) => {
                const isSelected =
                  vibe.trim().toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeVibe(preset)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs border transition-colors whitespace-nowrap shrink-0 lg:whitespace-normal lg:text-left ${
                      isSelected
                        ? "bg-zinc-200/15 border-white/25 text-zinc-100"
                        : "bg-[#131316] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:border-white/15"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Format Controls */}
      <div className="hidden lg:block pt-6 border-t border-white/[0.08]">
        <FormatControls
          aspectRatio={aspectRatio}
          onChangeAspectRatio={onChangeAspectRatio}
          imageSize={imageSize}
          onChangeImageSize={onChangeImageSize}
          model={model}
          onChangeModel={onChangeModel}
        />
      </div>
    </aside>
  );
}
