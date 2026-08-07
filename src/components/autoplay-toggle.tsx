"use client";

import { usePlayer } from "@/lib/player/player-context";

/** 読み取り後の自動再生オン/オフ。メイン画面と設定画面の両方から同じ設定を切り替える */
export function AutoPlayToggle() {
  const { autoPlay, setAutoPlay } = usePlayer();

  return (
    <div className="flex items-center gap-md">
      <span className="text-caption-md text-body-dark">読み取り後に自動再生</span>
      <button
        type="button"
        onClick={() => setAutoPlay(!autoPlay)}
        aria-pressed={autoPlay}
        className={`h-9 shrink-0 rounded-full px-md text-caption-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          autoPlay
            ? "bg-on-dark text-canvas"
            : "bg-[rgba(255,255,255,0.08)] text-body-dark hover:text-hover-cyan"
        }`}
      >
        {autoPlay ? "オン" : "オフ"}
      </button>
    </div>
  );
}
