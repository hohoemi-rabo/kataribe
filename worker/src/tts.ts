import { jsonError } from "./transcribe";
import type { Env } from "./types";

// 2026-08 時点の最新 TTS モデル（preview 系のため変動しやすい。変更時はここだけ直す）
const TTS_MODEL = "gemini-3.1-flash-tts-preview";

// 朗読向けの落ち着いたボイス。代替候補: Vindemiatrix(Gentle) / Achernar(Soft) / Despina(Smooth)
const TTS_VOICE = "Sulafat";

// input 先頭に付与すると読み方の指示として解釈される（本文としては読まれない）
const STYLE_INSTRUCTION =
  "落ち着いた優しい声で、物語を語り聞かせるようにゆっくり朗読してください:\n\n";

// Interactions API の PCM 出力仕様（24kHz / 16bit / mono）
const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BYTES_PER_SAMPLE = 2;

// 入力上限は 32k トークンのため通常分割は不要。暴走ガードとしての文字数上限
const MAX_TEXT_LENGTH = 16000;

export async function handleTts(request: Request, env: Env): Promise<Response> {
  let body: { text?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "リクエスト形式が不正です。");
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return jsonError(400, "読み上げるテキストがありません。");
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(400, `テキストが長すぎます（${MAX_TEXT_LENGTH}文字まで）。`);
  }

  const geminiResponse = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        input: STYLE_INSTRUCTION + text,
        response_format: { type: "audio" },
        generation_config: { speech_config: [{ voice: TTS_VOICE }] },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error(`Gemini TTS error (${geminiResponse.status}): ${detail}`);
    return jsonError(
      502,
      "音声の生成に失敗しました（Gemini TTSエラー）。時間をおいて再度お試しください。",
    );
  }

  const result = (await geminiResponse.json()) as {
    output_audio?: { data?: string };
    outputAudio?: { data?: string };
  };
  const audioBase64 = result.output_audio?.data ?? result.outputAudio?.data;
  if (!audioBase64) {
    console.error(
      `Gemini TTS: 音声データなし: ${JSON.stringify(result).slice(0, 500)}`,
    );
    return jsonError(502, "音声データを取得できませんでした。");
  }

  const pcm = base64ToBytes(audioBase64);
  const wav = pcmToWav(pcm, SAMPLE_RATE, NUM_CHANNELS, BYTES_PER_SAMPLE);

  return new Response(wav, {
    headers: { "Content-Type": "audio/wav" },
  });
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 生 PCM に 44 バイトの RIFF/WAV ヘッダを付ける */
function pcmToWav(
  pcm: Uint8Array,
  sampleRate: number,
  channels: number,
  bytesPerSample: number,
): ArrayBuffer {
  const byteRate = sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt チャンクサイズ
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);

  return buffer;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
