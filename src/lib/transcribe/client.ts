import { createClient } from "@/lib/supabase/client";

export const SECTION_IMAGE_JPEG_QUALITY = 0.92;

/** canvas → JPEG の生 base64（data URL プレフィックスなし） */
export function canvasToJpegBase64(canvas: HTMLCanvasElement): string {
  const dataUrl = canvas.toDataURL("image/jpeg", SECTION_IMAGE_JPEG_QUALITY);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}

/** 切り抜き画像を Worker /transcribe に送り、本文テキストを得る */
export async function transcribeImage(canvas: HTMLCanvasElement): Promise<string> {
  const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!workerUrl) {
    throw new Error("Worker URL が設定されていません（NEXT_PUBLIC_WORKER_URL）。");
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("セッションが切れています。再ログインしてください。");
  }

  let response: Response;
  try {
    response = await fetch(`${workerUrl}/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        imageBase64: canvasToJpegBase64(canvas),
        mimeType: "image/jpeg",
      }),
    });
  } catch {
    throw new Error(
      "Worker に接続できませんでした。ネットワークと Worker の起動状態を確認してください。",
    );
  }

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
