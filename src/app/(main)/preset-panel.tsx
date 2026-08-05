"use client";

import { useState } from "react";
import { PresetModal } from "@/components/preset-modal";
import { useCaptureContext } from "@/lib/capture/capture-context";
import type { RelativeRect } from "@/lib/capture/region";
import type { Preset } from "@/lib/presets/queries";
import { MANUAL_READ_ID } from "./main-screen";
import { ManualRegionModal } from "./manual-region-modal";

type PresetPanelProps = {
  gameId: string;
  presets: Preset[];
  onRead: (preset: Preset) => void;
  onManualRead: (frame: HTMLCanvasElement, rect: RelativeRect) => void;
  readingPresetId: string | null;
};

export function PresetPanel({
  gameId,
  presets,
  onRead,
  onManualRead,
  readingPresetId,
}: PresetPanelProps) {
  const { state, captureFrame } = useCaptureContext();
  const isCapturing = state === "capturing";
  const [modalFrame, setModalFrame] = useState<HTMLCanvasElement | null>(null);
  const [manualFrame, setManualFrame] = useState<HTMLCanvasElement | null>(null);
  const [frameError, setFrameError] = useState<string | null>(null);
  const isManualReading = readingPresetId === MANUAL_READ_ID;

  const grabFrame = (onFrame: (frame: HTMLCanvasElement) => void) => {
    setFrameError(null);
    try {
      onFrame(captureFrame());
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
        presets.map((preset) => {
          const isReading = readingPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onRead(preset)}
              disabled={!isCapturing || readingPresetId !== null}
              className="relative flex h-14 w-full items-center justify-center rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
            >
              {isReading && (
                <span
                  aria-hidden="true"
                  className="absolute left-lg h-4 w-4 animate-spin rounded-full border-2 border-mute-dark border-t-transparent"
                />
              )}
              <span className="truncate">
                {isReading ? "読み取り中…" : preset.name}
              </span>
            </button>
          );
        })
      )}

      <button
        type="button"
        onClick={() => grabFrame(setManualFrame)}
        disabled={!isCapturing || readingPresetId !== null}
        className="relative flex h-12 w-full items-center justify-center rounded-full border border-hairline-dark text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:border-transparent disabled:bg-surface-hover disabled:text-mute-dark"
      >
        {isManualReading && (
          <span
            aria-hidden="true"
            className="absolute left-lg h-4 w-4 animate-spin rounded-full border-2 border-mute-dark border-t-transparent"
          />
        )}
        {isManualReading ? "読み取り中…" : "今回だけ範囲指定"}
      </button>

      <button
        type="button"
        onClick={() => grabFrame(setModalFrame)}
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

      {manualFrame && (
        <ManualRegionModal
          frame={manualFrame}
          onCancel={() => setManualFrame(null)}
          onConfirm={(rect) => {
            const frame = manualFrame;
            setManualFrame(null);
            onManualRead(frame, rect);
          }}
        />
      )}
    </div>
  );
}
