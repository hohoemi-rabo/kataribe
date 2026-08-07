"use client";

import { useEffect, useRef, useState } from "react";
import { useCaptureContext } from "@/lib/capture/capture-context";
import { cropCanvas, type RelativeRect } from "@/lib/capture/region";
import { usePlayer } from "@/lib/player/player-context";
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
  /** 保存が失敗したまま終わった場合 true（「保存中…」を出し続けない） */
  saveFailed: boolean;
  createdAt: string;
};

type MainScreenProps = {
  gameId: string;
  presets: Preset[];
};

/** 手動読み取り中を表す readingPresetId（preset の id は uuid なので衝突しない） */
export const MANUAL_READ_ID = "manual";

/** player-bar に表示する読み上げ対象名（手動読み取りは "manual" で保存される） */
const speakTitle = (presetName: string) =>
  presetName === "manual" ? "手動範囲" : presetName;

export function MainScreen({ gameId, presets }: MainScreenProps) {
  const { state, captureFrame } = useCaptureContext();
  const { play, autoPlay } = usePlayer();
  const [readingPresetId, setReadingPresetId] = useState<string | null>(null);
  const [latest, setLatest] = useState<LatestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // テキスト化完了（数秒後）の時点でのトグル状態を尊重するため ref で参照する
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // 読み取り中に共有が停止されたとき、「読み取り中…」ボタン表示を残さない
  useEffect(() => {
    if (state !== "capturing") {
      setReadingPresetId(null);
    }
  }, [state]);

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

      // テキスト先出し: テキスト化が終わった時点でまず表示し、TTS 生成・保存は並行で進める
      const text = await transcribeImage(cropped);
      setLatest({
        presetName,
        content: text,
        imageDataUrl,
        seq: null,
        saveFailed: false,
        createdAt: new Date().toISOString(),
      });

      // テキスト化直後の自動再生（REQUIREMENTS §3.5 ①）。オフ時は「読み上げ」ボタンで手動再生
      if (autoPlayRef.current) {
        void play(speakTitle(presetName), text);
      }

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
        setLatest((current) =>
          current ? { ...current, saveFailed: true } : current,
        );
        return;
      }
      const savedSeq = result.section.seq;
      setLatest((current) => (current ? { ...current, seq: savedSeq } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
      setLatest((current) =>
        current && current.seq === null
          ? { ...current, saveFailed: true }
          : current,
      );
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
      setNotice(null);
      setError(err instanceof Error ? err.message : "読み取りに失敗しました。");
    }
  };

  const handleManualRead = (frame: HTMLCanvasElement, rect: RelativeRect) => {
    if (readingPresetId) return;
    try {
      void runRead(MANUAL_READ_ID, "manual", cropCanvas(frame, rect));
    } catch (err) {
      setNotice(null);
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
      {notice && (
        <p role="status" className="text-caption-md text-warning">
          {notice}
        </p>
      )}

      {latest && (
        <div className="flex flex-col gap-md rounded-md bg-surface-card p-lg lg:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- 直近の切り抜き画像（ローカル data URL） */}
          <img
            src={latest.imageDataUrl}
            alt={`${latest.presetName} の切り抜き画像`}
            className="w-full max-w-[320px] shrink-0 self-start rounded-md"
          />
          <div className="flex min-w-0 flex-col gap-sm">
            <div className="flex items-center gap-sm">
              {latest.seq !== null ? (
                <span className="rounded-full bg-primary px-[10px] py-xxs text-caption-sm text-on-primary">
                  #{latest.seq}
                </span>
              ) : latest.saveFailed ? (
                <span className="rounded-full border border-warning px-[10px] py-xxs text-caption-sm text-warning">
                  保存失敗
                </span>
              ) : (
                <span className="rounded-full bg-primary px-[10px] py-xxs text-caption-sm text-on-primary">
                  保存中…
                </span>
              )}
              <span className="text-caption-md text-mute-dark">
                {formatDateTimeJa(latest.createdAt)}・{latest.presetName}
              </span>
              <button
                type="button"
                onClick={() =>
                  void play(speakTitle(latest.presetName), latest.content)
                }
                className="ml-auto h-9 shrink-0 rounded-full border border-hairline-dark px-md text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                読み上げ
              </button>
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
