import { jsonError } from "./transcribe";
import type { Env } from "./types";

export type RateLimitedEndpoint = "transcribe" | "summarize" | "tts";

const LIMIT_VARS = {
  transcribe: "RATE_LIMIT_TRANSCRIBE",
  summarize: "RATE_LIMIT_SUMMARIZE",
  tts: "RATE_LIMIT_TTS",
} as const satisfies Record<RateLimitedEndpoint, keyof Env>;

const LABELS: Record<RateLimitedEndpoint, string> = {
  transcribe: "テキスト化",
  summarize: "あらすじ生成",
  tts: "音声生成",
};

/** JST の日付文字列（YYYY-MM-DD）。UTC+9 固定・DST なし */
function jstDate(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * 上限超過なら 429 Response を返し、通過ならカウントを進めて null を返す。
 * KV の read→write は非アトミックだが、単一ユーザーの暴走保険なので
 * 並行時の僅かな超過は許容する（docs/10-polish.md メモ参照）。
 */
export async function checkRateLimit(
  env: Env,
  email: string,
  endpoint: RateLimitedEndpoint,
): Promise<Response | null> {
  const limit = Number.parseInt(env[LIMIT_VARS[endpoint]], 10);
  // 設定不備で保険機能自体がサービスを止めないよう fail-open
  if (!Number.isFinite(limit) || limit <= 0) return null;

  const key = `rl:${email}:${endpoint}:${jstDate()}`;
  const count =
    Number.parseInt((await env.RATE_LIMIT_KV.get(key)) ?? "0", 10) || 0;

  if (count >= limit) {
    return jsonError(
      429,
      `${LABELS[endpoint]}の本日の利用回数が上限（${limit}回）に達しました。明日0時（日本時間）にリセットされます。`,
    );
  }

  await env.RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: 172_800,
  });
  return null;
}
