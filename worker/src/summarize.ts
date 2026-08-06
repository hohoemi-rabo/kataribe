import { jsonError } from "./transcribe";
import type { Env } from "./types";

// transcribe と同じ GA 安定版テキストモデル（2026-08 時点で確認）
const GEMINI_MODEL = "gemini-3.6-flash";

const MAX_SECTIONS = 200;
const MAX_TOTAL_CHARS = 100_000;
const MAX_TITLE_CHARS = 200;

// あらすじ生成の固定プロンプト（REQUIREMENTS.md §3.6。ネタバレ防止のため Worker 側で必ず付与し、
// フロントからは変更できない）
const SUMMARIZE_PROMPT = [
  "あなたはプレイヤー自身のプレイ記録から「ここまでのあらすじ」を語る語り部です。",
  "これから渡すのは、あるゲームのプレイ中に画面から書き起こしたテキスト（セクション）を時系列順に並べたものです。",
  "以下の制約を必ず守ってください。",
  "- 提供されたセクションのテキストのみを情報源とすること。",
  "- このゲームに関する外部知識・事前知識を一切使用しないこと。セクションに書かれていない人物・地名・出来事・今後の展開に言及してはならない。",
  "- 推測で補完せず、書かれている範囲で構成すること。",
  "- ゲームタイトルは記録のラベルとしてのみ扱い、そのタイトルについて知っていることがあっても一切使用しないこと。",
  "文体: 「だ・である」調ではなく、聞き手に語り聞かせるような自然な口調で書いてください（音声で朗読される前提です）。",
  "出力: あらすじの本文のみを出力し、前置き・説明・見出し・箇条書き・Markdown記法は使わないでください。長さは300〜800字程度を目安にしてください。",
].join("\n");

export async function handleSummarize(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: { gameTitle?: unknown; sections?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "リクエスト形式が不正です。");
  }

  const gameTitle =
    typeof body.gameTitle === "string" ? body.gameTitle.trim() : "";
  if (!gameTitle || gameTitle.length > MAX_TITLE_CHARS) {
    return jsonError(400, "ゲームタイトルが不正です。");
  }

  if (
    !Array.isArray(body.sections) ||
    !body.sections.every((section): section is string => typeof section === "string")
  ) {
    return jsonError(400, "セクションの形式が不正です。");
  }

  const sections = body.sections
    .map((section) => section.trim())
    .filter((section) => section.length > 0);

  if (sections.length === 0) {
    return jsonError(400, "あらすじの材料になるセクションがありません。");
  }
  if (sections.length > MAX_SECTIONS) {
    return jsonError(
      400,
      `セクション数が上限（${MAX_SECTIONS}件）を超えています。範囲を狭めてください。`,
    );
  }
  const totalChars = sections.reduce((sum, section) => sum + section.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return jsonError(
      400,
      "セクションの合計文字数が上限を超えています。範囲を狭めてください。",
    );
  }

  const input = [
    `ゲームタイトル（ラベル）: ${gameTitle}`,
    ...sections.map((section, index) => `【セクション${index + 1}】\n${section}`),
  ].join("\n\n");

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
            parts: [{ text: SUMMARIZE_PROMPT }, { text: input }],
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
      "あらすじの生成に失敗しました（Gemini APIエラー）。時間をおいて再度お試しください。",
    );
  }

  const result = (await geminiResponse.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const summary = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!summary) {
    return jsonError(
      502,
      "あらすじを生成できませんでした。時間をおいて再度お試しください。",
    );
  }

  return Response.json({ summary });
}
