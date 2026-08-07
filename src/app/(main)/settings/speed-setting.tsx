"use client";

import { PLAYBACK_SPEEDS, usePlayer } from "@/lib/player/player-context";

export function SpeedSetting() {
  const { defaultSpeed, setDefaultSpeed } = usePlayer();

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex gap-xs" role="group" aria-label="読み上げ速度">
        {PLAYBACK_SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => setDefaultSpeed(speed)}
            aria-pressed={defaultSpeed === speed}
            className={`h-9 rounded-full px-md text-caption-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              defaultSpeed === speed
                ? "bg-on-dark text-canvas"
                : "bg-[rgba(255,255,255,0.08)] text-body-dark hover:text-hover-cyan"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
      <p className="text-caption-md text-mute-dark">
        読み上げの標準速度。再生バーの速度ボタンでの変更はその場かぎりで、ページを再読み込みするとここで選んだ速度に戻ります。
      </p>
    </div>
  );
}
