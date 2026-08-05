import type { Env } from "./types";

// Vision 対応の GA 安定版（2026-08 時点で確認）。2.5 系は 2026-10-16 停止予定のため不使用
const GEMINI_MODEL = "gemini-3.6-flash";

// テキスト化の固定プロンプト（REQUIREMENTS.md §3.3。Worker 側で必ず付与する）
const TRANSCRIBE_PROMPT = [
  "この画像はゲーム画面の一部です。画像内の本文テキストのみを忠実に書き起こしてください。",
  "UI要素・ボタンラベル・メニュー項目・スクロールバー・ページ番号などの装飾的な文字列は無視してください。",
  "日本語のテキストは日本語のまま書き起こしてください。要約・意訳・補足は一切しないでください。",
  "出力は書き起こした本文のみとし、前置きや説明を付けないでください。",
].join("\n");

export function jsonError(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

export async function handleTranscribe(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: { imageBase64?: unknown; mimeType?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "リクエスト形式が不正です。");
  }

  const imageBase64 = typeof body.imageBase64 === "string" ? body.imageBase64 : null;
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";
  if (!imageBase64) {
    return jsonError(400, "画像データがありません。");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: TRANSCRIBE_PROMPT },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
      }),
    },
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error(`Gemini API error (${geminiResponse.status}): ${detail}`);
    return jsonError(
      502,
      "テキスト化に失敗しました（Gemini APIエラー）。時間をおいて再度お試しください。",
    );
  }

  const result = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    return jsonError(
      502,
      "テキストを抽出できませんでした。範囲や画面の状態を確認してもう一度お試しください。",
    );
  }

  return Response.json({ text });
}
