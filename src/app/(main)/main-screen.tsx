"use client";

import { useState } from "react";
import { useCaptureContext } from "@/lib/capture/capture-context";
import { cropCanvas, type RelativeRect } from "@/lib/capture/region";
import { formatDateTimeJa } from "@/lib/format";
import type { Preset } from "@/lib/presets/queries";
import { createSection } from "@/lib/sections/actions";
import { uploadSectionImage } from "@/lib/sections/upload";
import {
  SECTION_IMAGE_JPEG_QUALITY,
  transcribeImage,
} from "@/lib/transcribe/client";
import { CapturePanel } from "./capture-panel";
import { PresetPanel } from "./preset-panel";

type LatestResult = {
  presetName: string;
  content: string;
  imageDataUrl: string;
  /** 保存完了時に採番が入る。それまでは null（保存中） */
  seq: number | null;
  createdAt: string;
};

type MainScreenProps = {
  gameId: string;
  presets: Preset[];
};

/** 手動読み取り中を表す readingPresetId（preset の id は uuid なので衝突しない） */
export const MANUAL_READ_ID = "manual";

export function MainScreen({ gameId, presets }: MainScreenProps) {
  const { captureFrame } = useCaptureContext();
  const [readingPresetId, setReadingPresetId] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** 読み取りの共通コア（プリセット / 手動どちらもここに合流する） */
  const runRead = async (
    readingId: string,
    presetName: string,
    cropped: HTMLCanvasElement,
  ) => {
    setError(null);
    setNotice(null);
    setReadingPresetId(readingId);

    try {
      const imageDataUrl = cropped.toDataURL(
        "image/jpeg",
        SECTION_IMAGE_JPEG_QUALITY,
      );

      // テキスト先出し: テキスト化が終わった時点でまず表示（TTS を待たせない方針の土台）
      const text = await transcribeImage(cropped);
      setLatest({
        presetName,
        content: text,
        imageDataUrl,
        seq: null,
        createdAt: new Date().toISOString(),
      });

      // 画像保存は失敗してもテキストを失わない（image_path: null で退避保存）
      let imagePath: string | null = null;
      try {
        imagePath = await uploadSectionImage(cropped);
      } catch (uploadErr) {
        setNotice(
          uploadErr instanceof Error
            ? `${uploadErr.message} テキストのみ保存します。`
            : "画像の保存に失敗しました。テキストのみ保存します。",
        );
      }

      const result = await createSection(gameId, presetName, text, imagePath);
      if (result.error || !result.section) {
        setError(result.error ?? "セクションの保存に失敗しました。");
        return;
      }
      const savedSeq = result.section.seq;
      setLatest((current) => (current ? { ...current, seq: savedSeq } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
    } finally {
      setReadingPresetId(null);
    }
  };

  const handleRead = (preset: Preset) => {
    if (readingPresetId) return;
    try {
      const frame = captureFrame();
      void runRead(preset.id, preset.name, cropCanvas(frame, preset));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
    }
  };

  const handleManualRead = (frame: HTMLCanvasElement, rect: RelativeRect) => {
    if (readingPresetId) return;
    try {
      void runRead(MANUAL_READ_ID, "manual", cropCanvas(frame, rect));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid items-start gap-lg lg:grid-cols-[3fr_2fr]">
        <CapturePanel />
        <PresetPanel
          gameId={gameId}
          presets={presets}
          onRead={handleRead}
          onManualRead={handleManualRead}
          readingPresetId={readingPresetId}
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-warning">
          {error}
        </p>
      )}
      {notice && <p className="text-caption-md text-warning">{notice}</p>}

      {latest && (
        <div className="flex flex-col gap-md rounded-md bg-surface-card p-lg sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- 直近の切り抜き画像（ローカル data URL） */}
          <img
            src={latest.imageDataUrl}
            alt={`${latest.presetName} の切り抜き画像`}
            className="w-full max-w-[320px] shrink-0 self-start rounded-md"
          />
          <div className="flex min-w-0 flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <span className="rounded-full bg-primary px-[10px] py-xxs text-caption-sm text-on-primary">
                {latest.seq !== null ? `#${latest.seq}` : "保存中…"}
              </span>
              <span className="text-caption-md text-mute-dark">
                {formatDateTimeJa(latest.createdAt)}・{latest.presetName}
              </span>
            </div>
            <p className="max-w-[640px] whitespace-pre-wrap text-body-md text-body-dark">
              {latest.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
