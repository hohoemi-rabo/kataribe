"use client";

import { usePlayer } from "@/lib/player/player-context";

export const ICON_BUTTON_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.16)] text-on-dark transition-colors hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 disabled:hover:text-on-dark";

export function PlayerBar() {
  const { status, title, engine, error, pause, resume, stop } = usePlayer();

  if (status === "idle" && !error) return null;

  return (
    <div className="fixed bottom-lg left-1/2 z-40 -translate-x-1/2">
      <div className="flex h-16 items-center gap-md rounded-full bg-surface-elevated px-md">
        {error ? (
          <>
            <p role="alert" className="px-sm text-caption-md text-warning">
              {error}
            </p>
            <button
              type="button"
              onClick={stop}
              aria-label="閉じる"
              className={ICON_BUTTON_CLASS}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M2 2 L12 12 M12 2 L2 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            {status === "loading" ? (
              <span
                aria-label="音声を生成中"
                className="mx-sm h-5 w-5 animate-spin rounded-full border-2 border-mute-dark border-t-transparent"
              />
            ) : (
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={resume}
                  disabled={status !== "paused"}
                  aria-label="再生"
                  className={ICON_BUTTON_CLASS}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={pause}
                  disabled={status !== "playing"}
                  aria-label="一時停止"
                  className={ICON_BUTTON_CLASS}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                    <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={stop}
                  aria-label="停止"
                  className={ICON_BUTTON_CLASS}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="3" y="3" width="10" height="10" fill="currentColor" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex min-w-0 flex-col pr-sm">
              <span className="max-w-[240px] truncate text-caption-md text-body-dark">
                {status === "loading" ? "音声を生成中…" : title}
              </span>
              {engine === "webspeech" && (
                <span className="text-caption-sm text-mute-dark">
                  代替音声（ブラウザ読み上げ）
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
