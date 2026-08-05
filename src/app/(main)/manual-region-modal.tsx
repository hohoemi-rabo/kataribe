"use client";

import { useMemo } from "react";
import { RegionSelector } from "@/components/region-selector";
import type { RelativeRect } from "@/lib/capture/region";

type ManualRegionModalProps = {
  /** ボタン押下時点の静止画（元解像度） */
  frame: HTMLCanvasElement;
  onCancel: () => void;
  onConfirm: (rect: RelativeRect) => void;
};

/** 「今回だけ範囲指定」: プリセットに保存せず、その場で選択した範囲を1回だけ読み取る */
export function ManualRegionModal({
  frame,
  onCancel,
  onConfirm,
}: ManualRegionModalProps) {
  const imageUrl = useMemo(() => frame.toDataURL("image/png"), [frame]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="今回だけ範囲指定"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-lg"
    >
      <div className="flex max-h-full w-full max-w-[900px] flex-col gap-lg overflow-y-auto rounded-lg bg-surface-elevated p-lg">
        <div className="flex items-center justify-between gap-md">
          <h3 className="text-heading-lg">今回だけ範囲指定</h3>
          <button
            type="button"
            onClick={onCancel}
            className="h-12 shrink-0 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            キャンセル
          </button>
        </div>
        <RegionSelector
          imageUrl={imageUrl}
          confirmLabel="この範囲を読み取り"
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}
