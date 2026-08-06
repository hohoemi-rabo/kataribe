import { verifyRequest } from "./auth";
import { checkRateLimit } from "./rate-limit";
import { handleSummarize } from "./summarize";
import { handleTranscribe, jsonError } from "./transcribe";
import { handleTts } from "./tts";
import type { Env } from "./types";

function corsHeaders(
  env: Env,
  requestOrigin: string | null,
): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  // Origin ヘッダーと完全一致したものだけエコーする。不一致は先頭を返す＝実質ブロック
  const matched =
    requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : allowed[0];
  return {
    "Access-Control-Allow-Origin": matched,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response: Response, env: Env, origin: string | null): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(env, origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, origin) });
    }

    const auth = await verifyRequest(request, env);
    if (!auth) {
      return withCors(
        jsonError(401, "認証に失敗しました。再ログインしてください。"),
        env,
        origin,
      );
    }

    // レート制限は path マッチ後に消費する（404 でクォータを減らさない）
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/transcribe") {
      const limited = await checkRateLimit(env, auth.email, "transcribe");
      if (limited) return withCors(limited, env, origin);
      return withCors(await handleTranscribe(request, env), env, origin);
    }
    if (request.method === "POST" && url.pathname === "/summarize") {
      const limited = await checkRateLimit(env, auth.email, "summarize");
      if (limited) return withCors(limited, env, origin);
      return withCors(await handleSummarize(request, env), env, origin);
    }
    if (request.method === "POST" && url.pathname === "/tts") {
      const limited = await checkRateLimit(env, auth.email, "tts");
      if (limited) return withCors(limited, env, origin);
      return withCors(await handleTts(request, env), env, origin);
    }

    return withCors(jsonError(404, "Not Found"), env, origin);
  },
} satisfies ExportedHandler<Env>;
