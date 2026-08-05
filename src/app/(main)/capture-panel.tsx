"use client";

import { useState } from "react";
import { useCapture } from "@/hooks/use-capture";

type TestFrame = {
  dataUrl: string;
  width: number;
  height: number;
};

export function CapturePanel() {
  const { videoRef, state, error, startCapture, stopCapture, captureFrame } =
    useCapture();
  const [testFrame, setTestFrame] = useState<TestFrame | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);

  const isCapturing = state === "capturing";

  const handleStop = () => {
    stopCapture();
    setTestFrame(null);
    setFrameError(null);
  };

  const handleTestCapture = () => {
    setFrameError(null);
    try {
      const canvas = captureFrame();
      setTestFrame({
        dataUrl: canvas.toDataURL("image/png"),
        width: canvas.width,
        height: canvas.height,
      });
    } catch (err) {
      setFrameError(
        err instanceof Error ? err.message : "フレームの取得に失敗しました。",
      );
    }
  };

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
            onClick={handleStop}
            className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            キャプチャ停止
          </button>
          <button
            type="button"
            onClick={handleTestCapture}
            className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            フレーム取得テスト
          </button>
        </div>
      )}

      {frameError && (
        <p role="alert" className="text-caption-md text-warning">
          {frameError}
        </p>
      )}

      {testFrame && (
        <div className="flex flex-col gap-xs">
          <p className="text-caption-md text-mute-dark">
            取得フレーム（開発確認用） — 実解像度 {testFrame.width}×
            {testFrame.height}
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- 開発確認用の data URL 表示。チケット04で削除 */}
          <img
            src={testFrame.dataUrl}
            alt="取得したフレーム"
            className="w-full rounded-md"
          />
        </div>
      )}
    </div>
  );
}
