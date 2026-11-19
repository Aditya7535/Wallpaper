import {
  ASPECT_RATIO_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  MODEL_OPTIONS,
} from "../data/presets";
import type { AspectRatio, ImageModel, ImageSize } from "../types";

interface FormatControlsProps {
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  imageSize: ImageSize;
  onChangeImageSize: (size: ImageSize) => void;
  model: ImageModel;
  onChangeModel: (model: ImageModel) => void;
}

function RatioGlyph({
  widthRatio,
  heightRatio,
  active,
}: {
  widthRatio: number;
  heightRatio: number;
  active: boolean;
}) {
  const maxBox = 18;
  const scale = maxBox / Math.max(widthRatio, heightRatio);
  const w = Math.max(6, Math.round(widthRatio * scale));
  const h = Math.max(6, Math.round(heightRatio * scale));

  return (
    <span
      aria-hidden="true"
      className="w-5 h-5 flex items-center justify-center shrink-0"
    >
      <span
        style={{ width: `${w}px`, height: `${h}px` }}
        className={`block rounded-[3px] border transition-colors ${
          active
            ? "border-zinc-950 bg-zinc-950/15"
            : "border-zinc-500 bg-zinc-800/40"
        }`}
      />
    </span>
  );
}

export function FormatControls({
  aspectRatio,
  onChangeAspectRatio,
  imageSize,
  onChangeImageSize,
  model,
  onChangeModel,
}: FormatControlsProps) {
  return (
    <div className="space-y-6">
      {/* Aspect Ratio */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-xs font-medium text-zinc-300">Aspect Ratio</span>
          <span className="text-xs font-mono tabular-nums text-zinc-500">
            {aspectRatio}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Aspect Ratio"
          className="grid grid-cols-4 gap-2"
        >
          {ASPECT_RATIO_OPTIONS.map((opt) => {
            const active = aspectRatio === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChangeAspectRatio(opt.value)}
                title={`${opt.label} — ${opt.caption}`}
                className={`min-h-[54px] px-1.5 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  active
                    ? "bg-zinc-100 border-zinc-100 text-zinc-950"
                    : "bg-[#16161A] border-white/[0.08] text-zinc-300 hover:border-white/20 hover:text-zinc-100"
                }`}
              >
                <RatioGlyph
                  widthRatio={opt.widthRatio}
                  heightRatio={opt.heightRatio}
                  active={active}
                />
                <span className="text-[11px] font-mono tabular-nums font-medium leading-none whitespace-nowrap">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Resolution / Size */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-xs font-medium text-zinc-300">Resolution</span>
          <span className="text-xs text-zinc-500">
            {IMAGE_SIZE_OPTIONS.find((s) => s.value === imageSize)?.detail}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Image Resolution"
          className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#111114] border border-white/[0.07]"
        >
          {IMAGE_SIZE_OPTIONS.map((size) => {
            const active = imageSize === size.value;
            return (
              <button
                key={size.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChangeImageSize(size.value)}
                className={`min-h-[44px] px-3 py-2 rounded-lg flex flex-col items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  active
                    ? "bg-zinc-100 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <span className="text-xs font-mono tabular-nums font-semibold leading-tight">
                  {size.label}
                </span>
                <span
                  className={`text-[10px] leading-tight mt-0.5 whitespace-nowrap ${
                    active ? "text-zinc-700" : "text-zinc-500"
                  }`}
                >
                  {size.detail}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Selector */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <span className="text-xs font-medium text-zinc-300">Image Model</span>
          <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[190px]">
            {model}
          </span>
        </div>
        <div
          role="radiogroup"
          aria-label="Image Generation Model"
          className="grid grid-cols-2 gap-2"
        >
          {MODEL_OPTIONS.map((opt) => {
            const active = model === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChangeModel(opt.value)}
                className={`min-h-[56px] px-3 py-2.5 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  active
                    ? "bg-zinc-100 border-zinc-100 text-zinc-950"
                    : "bg-[#16161A] border-white/[0.08] text-zinc-200 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-semibold leading-tight whitespace-nowrap truncate">
                  {opt.label}
                </div>
                <div
                  className={`text-[11px] leading-snug mt-1 line-clamp-2 ${
                    active ? "text-zinc-700" : "text-zinc-500"
                  }`}
                >
                  {opt.detail}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
