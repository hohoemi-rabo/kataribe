"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { captureVideoFrame } from "@/lib/capture/frame";

export type CaptureState = "idle" | "capturing";

/**
 * getDisplayMedia によるキャプチャ状態の管理。
 * ストリームは復元不可のため、タブ再読み込み後は必ず idle から始まる。
 */
export function useCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stopCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      streamRef.current = stream;

      // ブラウザ側/OS側どちらから共有停止されても idle へ戻す
      for (const track of stream.getVideoTracks()) {
        track.addEventListener("ended", stopCapture);
      }

      const video = videoRef.current;
      if (!video) {
        stopCapture();
        throw new Error("プレビュー用の video 要素が見つかりません。");
      }
      video.srcObject = stream;
      await video.play();

      setState("capturing");
    } catch (err) {
      // ユーザーがウィンドウ選択ダイアログをキャンセルしただけならエラー扱いしない
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        return;
      }
      stopCapture();
      setError("キャプチャを開始できませんでした。もう一度お試しください。");
    }
  }, [stopCapture]);

  // アンマウント時にストリームを解放（画面遷移で共有が残らないように）
  useEffect(() => stopCapture, [stopCapture]);

  const captureFrame = useCallback((): HTMLCanvasElement => {
    const video = videoRef.current;
    if (!video || state !== "capturing") {
      throw new Error("キャプチャ中ではないため、フレームを取得できません。");
    }
    return captureVideoFrame(video);
  }, [state]);

  return { videoRef, state, error, startCapture, stopCapture, captureFrame };
}
