"use client";

import { useMemo, useState, useTransition } from "react";
import { RegionSelector } from "./region-selector";
import { cropCanvas, type RelativeRect } from "@/lib/capture/region";
import { createPreset, updatePresetRect } from "@/lib/presets/actions";
import type { Preset } from "@/lib/presets/queries";

type PresetModalProps =
  | {
      mode: "create";
      frame: HTMLCanvasElement;
      gameId: string;
      onClose: () => void;
    }
  | {
      mode: "edit-rect";
      frame: HTMLCanvasElement;
      preset: Preset;
      onClose: () => void;
    };

export function PresetModal(props: PresetModalProps) {
  const { frame, onClose } = props;
  const [step, setStep] = useState<"select" | "name">("select");
  const [rect, setRect] = useState<RelativeRect | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const imageUrl = useMemo(() => frame.toDataURL("image/png"), [frame]);
  const cropPreviewUrl = useMemo(() => {
    if (!rect || step !== "name") return null;
    return cropCanvas(frame, rect).toDataURL("image/png");
  }, [frame, rect, step]);

  const handleConfirmRect = (confirmed: RelativeRect) => {
    if (isPending) return;
    setError(null);
    if (props.mode === "edit-rect") {
      startTransition(async () => {
        const result = await updatePresetRect(props.preset.id, confirmed);
        if (result.error) {
          setError(result.error);
        } else {
          props.onClose();
        }
      });
    } else {
      setRect(confirmed);
      setStep("name");
    }
  };

  const handleSave = () => {
    if (props.mode !== "create" || !rect) return;
    setError(null);
    startTransition(async () => {
      const result = await createPreset(props.gameId, name, rect);
      if (result.error) {
        setError(result.error);
      } else {
        props.onClose();
      }
    });
  };

  const title =
    props.mode === "edit-rect"
      ? `「${props.preset.name}」の範囲を再登録`
      : step === "name"
        ? "プリセット名を入力"
        : "範囲を選択";

  const initialRect =
    props.mode === "edit-rect"
      ? {
          x: props.preset.x,
          y: props.preset.y,
          w: props.preset.w,
          h: props.preset.h,
        }
      : (rect ?? undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-lg"
    >
      <div className="flex max-h-full w-full max-w-[900px] flex-col gap-lg overflow-y-auto rounded-lg bg-surface-elevated p-lg">
        <div className="flex items-center justify-between gap-md">
          <h3 className="text-heading-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-12 shrink-0 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>

        {step === "select" ? (
          <>
            <RegionSelector
              imageUrl={imageUrl}
              initialRect={initialRect}
              confirmLabel={
                props.mode === "edit-rect" ? "この範囲で保存" : "確定"
              }
              onConfirm={handleConfirmRect}
            />
            {isPending && (
              <p className="text-caption-md text-mute-dark">保存中…</p>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-lg">
            {cropPreviewUrl && (
              <div className="flex flex-col gap-xs">
                <p className="text-caption-md text-mute-dark">
                  切り抜きプレビュー
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element -- 切り抜き結果（data URL）の表示 */}
                <img
                  src={cropPreviewUrl}
                  alt="切り抜きプレビュー"
                  className="max-h-[320px] w-auto max-w-full self-start rounded-md"
                />
              </div>
            )}
            <div className="flex items-center gap-sm">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="プリセット名（例: ジャーナル）"
                maxLength={100}
                autoFocus
                className="h-12 w-full max-w-[400px] rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md text-body-sm text-on-dark placeholder:text-mute-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || name.trim().length === 0}
                className="h-14 shrink-0 rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
              >
                {isPending ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setStep("select")}
                disabled={isPending}
                className="h-12 shrink-0 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-caption-md text-warning">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
