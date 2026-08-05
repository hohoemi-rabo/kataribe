import { verifyRequest } from "./auth";
import { handleTranscribe, jsonError } from "./transcribe";
import { handleTts } from "./tts";
import type { Env } from "./types";

function corsHeaders(env: Env): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(env))) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const auth = await verifyRequest(request, env);
    if (!auth) {
      return withCors(
        jsonError(401, "認証に失敗しました。再ログインしてください。"),
        env,
      );
    }

    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/transcribe") {
      return withCors(await handleTranscribe(request, env), env);
    }
    if (request.method === "POST" && url.pathname === "/tts") {
      return withCors(await handleTts(request, env), env);
    }

    return withCors(jsonError(404, "Not Found"), env);
  },
} satisfies ExportedHandler<Env>;
