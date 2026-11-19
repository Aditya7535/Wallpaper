import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { AspectRatio, ImageModel, ImageSize } from "../types";
import { FormatControls } from "./FormatControls";

interface FormatBottomSheetProps {
  open: boolean;
  onClose: () => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  imageSize: ImageSize;
  onChangeImageSize: (size: ImageSize) => void;
  model: ImageModel;
  onChangeModel: (model: ImageModel) => void;
}

export function FormatBottomSheet({
  open,
  onClose,
  aspectRatio,
  onChangeAspectRatio,
  imageSize,
  onChangeImageSize,
  model,
  onChangeModel,
}: FormatBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Wallpaper Format Settings"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-h-[85dvh] flex flex-col rounded-t-3xl bg-[#131316] border-t border-white/10 shadow-2xl"
          >
            {/* Drag handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
            </div>

            <div className="px-5 pt-2 pb-4 flex items-center justify-between border-b border-white/[0.06]">
              <h2 className="font-display text-base font-semibold text-zinc-50">
                Output Format
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close format settings"
                className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5 overflow-y-auto">
              <FormatControls
                aspectRatio={aspectRatio}
                onChangeAspectRatio={onChangeAspectRatio}
                imageSize={imageSize}
                onChangeImageSize={onChangeImageSize}
                model={model}
                onChangeModel={onChangeModel}
              />
            </div>

            <div className="px-5 pt-3 pb-safe border-t border-white/[0.06] bg-[#131316]">
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-xl bg-zinc-100 text-zinc-950 text-sm font-semibold hover:bg-white active:scale-[0.98] transition-all"
              >
                Apply Format
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
