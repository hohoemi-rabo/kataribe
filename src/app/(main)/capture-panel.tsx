"use client";

import { useEffect, useRef } from "react";
import { useCaptureContext } from "@/lib/capture/capture-context";

export function CapturePanel() {
  const { state, error, stream, startCapture, stopCapture } =
    useCaptureContext();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isCapturing = state === "capturing";

  // プロバイダが保持するストリームをプレビュー用 video にアタッチ
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      // 表示専用の play()。直後のアンマウント等で起きる AbortError は無害
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="flex flex-col gap-sm">
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-surface-elevated">
        <video
          ref={videoRef}
          muted
          playsInline
          className={`h-full w-full object-contain ${isCapturing ? "" : "invisible"}`}
        />
        {!isCapturing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-md">
            <button
              type="button"
              onClick={startCapture}
              className="h-14 rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed"
            >
              キャプチャ開始
            </button>
            {error && (
              <p role="alert" className="text-caption-md text-warning">
                {error}
              </p>
            )}
          </div>
        )}
        {isCapturing && (
          <span className="absolute right-md top-md flex items-center gap-xs rounded-full border border-hairline-dark bg-surface-card px-sm py-xxs text-caption-sm text-on-dark">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-recording animate-recording-blink"
            />
            キャプチャ中
          </span>
        )}
      </div>

      {isCapturing && (
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={stopCapture}
            className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            キャプチャ停止
          </button>
        </div>
      )}
    </div>
  );
}
