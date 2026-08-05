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
    });
  } catch {
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
