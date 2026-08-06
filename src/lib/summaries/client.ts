import { workerFetch } from "@/lib/worker-client";

/** セクションテキスト群を Worker /summarize に送り、あらすじを得る */
export async function generateSummary(
  gameTitle: string,
  sections: string[],
): Promise<string> {
  const response = await workerFetch("/summarize", { gameTitle, sections });

  const result = (await response.json().catch(() => null)) as {
    summary?: string;
    error?: string;
  } | null;

  if (!response.ok || !result?.summary) {
    throw new Error(
      result?.error ??
        `あらすじの生成に失敗しました（HTTP ${response.status}）。`,
    );
  }
  return result.summary;
}
