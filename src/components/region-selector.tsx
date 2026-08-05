"use client";

import { useCallback, useRef, useState } from "react";
import {
  clamp01,
  clampRect,
  isValidRect,
  type RelativeRect,
} from "@/lib/capture/region";

type Corner = "nw" | "ne" | "sw" | "se";

type Point = { x: number; y: number };

type RegionSelectorProps = {
  /** キャプチャフレームの data URL */
  imageUrl: string;
  initialRect?: RelativeRect;
  confirmLabel: string;
  onConfirm: (rect: RelativeRect) => void;
};

const HANDLE_CLASSES: Record<Corner, string> = {
  nw: "-left-1 -top-1 cursor-nwse-resize",
  ne: "-right-1 -top-1 cursor-nesw-resize",
  sw: "-bottom-1 -left-1 cursor-nesw-resize",
  se: "-bottom-1 -right-1 cursor-nwse-resize",
};

/**
 * 静止画へのドラッグ矩形選択オーバーレイ（DESIGN.md §5）。
 * 内部状態は常に相対座標（0〜1）で持ち、表示サイズに依存しない。
 */
export function RegionSelector({
  imageUrl,
  initialRect,
  confirmLabel,
  onConfirm,
}: RegionSelectorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // ドラッグ中の固定点（新規描画: 始点 / ハンドル: 対角コーナー）
  const dragOriginRef = useRef<Point | null>(null);
  const [rect, setRect] = useState<RelativeRect | null>(initialRect ?? null);
  const [isDragging, setIsDragging] = useState(false);

  const getRelativePoint = useCallback((event: React.PointerEvent): Point => {
    const bounds = containerRef.current!.getBoundingClientRect();
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height),
    };
  }, []);

  const beginDrag = (event: React.PointerEvent, origin: Point) => {
    dragOriginRef.current = origin;
    setIsDragging(true);
    containerRef.current?.setPointerCapture(event.pointerId);
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const point = getRelativePoint(event);
    setRect({ x: point.x, y: point.y, w: 0, h: 0 });
    beginDrag(event, point);
  };

  const handleHandlePointerDown = (event: React.PointerEvent, corner: Corner) => {
    if (event.button !== 0 || !rect) return;
    event.stopPropagation();
    const anchors: Record<Corner, Point> = {
      nw: { x: rect.x + rect.w, y: rect.y + rect.h },
      ne: { x: rect.x, y: rect.y + rect.h },
      sw: { x: rect.x + rect.w, y: rect.y },
      se: { x: rect.x, y: rect.y },
    };
    beginDrag(event, anchors[corner]);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const origin = dragOriginRef.current;
    if (!origin) return;
    const point = getRelativePoint(event);
    setRect(
      clampRect({
        x: Math.min(origin.x, point.x),
        y: Math.min(origin.y, point.y),
        w: Math.abs(point.x - origin.x),
        h: Math.abs(point.y - origin.y),
      }),
    );
  };

  const handlePointerUp = () => {
    if (!dragOriginRef.current) return;
    dragOriginRef.current = null;
    setIsDragging(false);
    // 誤クリック等の極小矩形は破棄
    setRect((current) => (current && isValidRect(current) ? current : null));
  };

  const showConfirm = rect !== null && isValidRect(rect) && !isDragging;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full cursor-crosshair touch-none select-none overflow-hidden rounded-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- キャプチャフレーム（data URL）の表示 */}
      <img
        src={imageUrl}
        alt="キャプチャした静止画"
        draggable={false}
        className="pointer-events-none block w-full"
      />
      {rect === null ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-body-sm text-on-dark">ドラッグで範囲を選択</p>
        </div>
      ) : (
        <div
          className="absolute border-2 border-hover-cyan"
          style={{
            left: `${rect.x * 100}%`,
            top: `${rect.y * 100}%`,
            width: `${rect.w * 100}%`,
            height: `${rect.h * 100}%`,
            // 矩形の内側だけ素通しにする半透明黒オーバーレイ
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
          }}
        >
          {(Object.keys(HANDLE_CLASSES) as Corner[]).map((corner) => (
            <span
              key={corner}
              onPointerDown={(event) => handleHandlePointerDown(event, corner)}
              className={`absolute h-2 w-2 bg-hover-cyan ${HANDLE_CLASSES[corner]}`}
            />
          ))}
        </div>
      )}
      {showConfirm && (
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onConfirm(rect)}
          className="absolute z-10 h-14 -translate-x-1/2 rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed"
          style={{
            left: `clamp(96px, ${(rect.x + rect.w / 2) * 100}%, calc(100% - 96px))`,
            top: `min(calc(${(rect.y + rect.h) * 100}% + 12px), calc(100% - 68px))`,
          }}
        >
          {confirmLabel}
        </button>
      )}
    </div>
  );
}
