import { SlidersHorizontal, Plus } from "lucide-react";
import type { AspectRatio, ImageSize, TabView } from "../types";

interface TopBarProps {
  activeTab: TabView;
  onSelectTab: (tab: TabView) => void;
  savedCount: number;
  historyCount: number;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  onOpenFormatSheet: () => void;
  onNewVibe: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  savedCount,
  historyCount,
  aspectRatio,
  imageSize,
  onOpenFormatSheet,
  onNewVibe,
}: TopBarProps) {
  const navItems: Array<{ id: TabView; label: string; count?: number }> = [
    { id: "studio", label: "Studio" },
    { id: "history", label: "History", count: historyCount },
    { id: "saved", label: "Saved", count: savedCount },
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#09090B]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab("studio")}
          className="font-display text-lg font-semibold tracking-tight text-zinc-50 whitespace-nowrap shrink-0 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-md"
        >
          VibeFrame
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-4 sm:gap-7"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative min-h-[44px] flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:text-zinc-50 ${
                  isActive
                    ? "text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="font-mono text-xs tabular-nums text-zinc-500">
                    {item.count}
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-100 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary contextual action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenFormatSheet}
            aria-label="Configure aspect ratio, resolution, and model"
            className="lg:hidden inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#16161A] border border-white/10 text-xs font-medium text-zinc-100 hover:bg-[#1E1E24] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums">
              {aspectRatio} · {imageSize}
            </span>
          </button>

          <button
            type="button"
            onClick={onNewVibe}
            className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white active:scale-[0.98] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Vibe</span>
          </button>
        </div>
      </div>
    </header>
  );
}
