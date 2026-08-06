import { createClient } from "@/lib/supabase/client";

/** セッション JWT を付けて Cloudflare Worker のエンドポイントを呼ぶ共通ヘルパー */
export async function workerFetch(path: string, body: unknown): Promise<Response> {
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

  try {
    return await fetch(`${workerUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      // Gemini の生成待ちを考慮した上限。ハング時に UI が固まり続けるのを防ぐ
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    console.error(`workerFetch failed (${path}):`, err);
    if (
      err instanceof DOMException &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new Error(
        "Worker への応答がタイムアウトしました。時間をおいて再度お試しください。",
      );
    }
    throw new Error(
      "Worker に接続できませんでした。ネットワークと Worker の状態を確認してください。",
    );
  }
}

/** エラーレスポンス（JSON）から表示用メッセージを取り出す */
export async function workerErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const result = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return result?.error ?? fallback;
}
