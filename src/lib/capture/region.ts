/**
 * 相対座標矩形（すべて 0〜1）。プリセットの保存形式と同一で、
 * 解像度が変わっても同じ相対位置を指す。登録（04）と切り抜き（05〜06）で共用。
 */
export type RelativeRect = { x: number; y: number; w: number; h: number };

/** 誤クリック防止の最小サイズ（相対値） */
export const MIN_RELATIVE_SIZE = 0.01;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function clampRect(rect: RelativeRect): RelativeRect {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);
  return {
    x,
    y,
    w: clamp01(Math.min(rect.w, 1 - x)),
    h: clamp01(Math.min(rect.h, 1 - y)),
  };
}

export function isValidRect(rect: RelativeRect): boolean {
  return rect.w >= MIN_RELATIVE_SIZE && rect.h >= MIN_RELATIVE_SIZE;
}

/** 相対矩形 → 実ピクセル矩形（丸め + 境界クランプ、最小 1px 保証） */
export function toPixelRect(
  rect: RelativeRect,
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } {
  const x = Math.min(Math.round(rect.x * width), width - 1);
  const y = Math.min(Math.round(rect.y * height), height - 1);
  return {
    x,
    y,
    w: Math.max(1, Math.min(Math.round(rect.w * width), width - x)),
    h: Math.max(1, Math.min(Math.round(rect.h * height), height - y)),
  };
}

/** 元解像度の canvas から相対矩形で切り抜いた canvas を返す */
export function cropCanvas(
  source: HTMLCanvasElement,
  rect: RelativeRect,
): HTMLCanvasElement {
  const pixel = toPixelRect(rect, source.width, source.height);
  const canvas = document.createElement("canvas");
  canvas.width = pixel.w;
  canvas.height = pixel.h;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("切り抜きに失敗しました。canvas の初期化に失敗しました。");
  }
  context.drawImage(
    source,
    pixel.x,
    pixel.y,
    pixel.w,
    pixel.h,
    0,
    0,
    pixel.w,
    pixel.h,
  );
  return canvas;
}
