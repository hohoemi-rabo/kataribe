"use client";

import { useState } from "react";
import { PresetModal } from "@/components/preset-modal";
import { useCaptureContext } from "@/lib/capture/capture-context";
import type { Preset } from "@/lib/presets/queries";

type PresetPanelProps = {
  gameId: string;
  presets: Preset[];
};

export function PresetPanel({ gameId, presets }: PresetPanelProps) {
  const { state, captureFrame } = useCaptureContext();
  const isCapturing = state === "capturing";
  const [modalFrame, setModalFrame] = useState<HTMLCanvasElement | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);

  const handleOpenRegister = () => {
    setFrameError(null);
    try {
      setModalFrame(captureFrame());
    } catch (err) {
      setFrameError(
        err instanceof Error ? err.message : "フレームの取得に失敗しました。",
      );
    }
  };

  return (
    <div className="flex flex-col gap-sm">
      {presets.length === 0 ? (
        <p className="text-caption-md text-mute-dark">
          範囲を登録するとここに「読んで」ボタンが並びます。
        </p>
      ) : (
        presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={!isCapturing}
            className="h-14 w-full truncate rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
          >
            {preset.name}
          </button>
        ))
      )}

      <button
        type="button"
        onClick={handleOpenRegister}
        disabled={!isCapturing}
        className="h-12 w-full rounded-full border border-hairline-dark text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:border-transparent disabled:bg-surface-hover disabled:text-mute-dark"
      >
        範囲を登録
      </button>

      {!isCapturing && (
        <p className="text-caption-sm text-mute-dark">
          キャプチャ開始後に操作できます
        </p>
      )}
      {frameError && (
        <p role="alert" className="text-caption-md text-warning">
          {frameError}
        </p>
      )}

      {modalFrame && (
        <PresetModal
          mode="create"
          frame={modalFrame}
          gameId={gameId}
          onClose={() => setModalFrame(null)}
        />
      )}
    </div>
  );
}
