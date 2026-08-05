import { workerErrorMessage, workerFetch } from "@/lib/worker-client";

/** テキストを Worker /tts で WAV 化して返す（音声は保存せず都度生成） */
export async function fetchTtsAudio(text: string): Promise<Blob> {
  const response = await workerFetch("/tts", { text });

  if (!response.ok) {
    throw new Error(
      await workerErrorMessage(
        response,
        `音声の生成に失敗しました（HTTP ${response.status}）。`,
      ),
    );
  }
  return response.blob();
}
