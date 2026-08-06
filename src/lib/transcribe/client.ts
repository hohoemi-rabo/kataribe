import { workerFetch } from "@/lib/worker-client";

export const SECTION_IMAGE_JPEG_QUALITY = 0.92;

/** canvas → JPEG の生 base64（data URL プレフィックスなし） */
function canvasToJpegBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/jpeg", SECTION_IMAGE_JPEG_QUALITY);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/** 切り抜き画像を Worker /transcribe に送り、本文テキストを得る */
export async function transcribeImage(canvas: HTMLCanvasElement): Promise<string> {
  const response = await workerFetch("/transcribe", {
    imageBase64: canvasToJpegBase64(canvas),
    mimeType: "image/jpeg",
  });

  const result = (await response.json().catch(() => null)) as {
    text?: string;
    error?: string;
  } | null;

  if (!response.ok || !result?.text) {
    throw new Error(
      result?.error ?? `テキスト化に失敗しました（HTTP ${response.status}）。`,
    );
  }
  return result.text;
}
