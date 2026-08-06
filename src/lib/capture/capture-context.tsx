"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { captureVideoFrame } from "./frame";

export type CaptureState = "idle" | "capturing";

type CaptureContextValue = {
  state: CaptureState;
  error: string | null;
  /** 共有側からの停止など、エラーではないが伝えるべき状態変化の案内 */
  notice: string | null;
  /** プレビュー表示用。各コンポーネントが自分の video 要素にアタッチする */
  stream: MediaStream | null;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  captureFrame: () => HTMLCanvasElement;
};

const CaptureContext = createContext<CaptureContextValue | null>(null);

/**
 * キャプチャ状態を (main) 配下の全ページで共有するプロバイダ。
 * フレーム取得用の video は DOM 外で保持するため、ページ遷移しても
 * ストリームが生き続ける（設定画面での範囲再登録が成立する）。
 */
export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stopCapture = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setStream(null);
    setState("idle");
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);
    setNotice(null);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      streamRef.current = mediaStream;

      // ブラウザ側/OS側どちらから共有停止されても idle へ戻し、無言終了にしない
      const handleTrackEnded = () => {
        stopCapture();
        setNotice(
          "画面共有が終了しました。再開するには「キャプチャ開始」を押してください。",
        );
      };
      for (const track of mediaStream.getVideoTracks()) {
        track.addEventListener("ended", handleTrackEnded);
      }

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = mediaStream;
      await video.play();
      videoRef.current = video;

      setStream(mediaStream);
      setState("capturing");
    } catch (err) {
      console.error("startCapture failed:", err);
      // NotAllowedError はユーザーキャンセルと OS/ブラウザの許可ブロックが区別できないため、
      // どちらでも案内を出す（ブロック時に無反応になるのを防ぐ）
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "画面共有が許可されませんでした。もう一度お試しください。OSやブラウザの画面収録許可も確認してください。",
        );
        return;
      }
      stopCapture();
      setError("キャプチャを開始できませんでした。もう一度お試しください。");
    }
  }, [stopCapture]);

  // アンマウント（(main) 群からの離脱）時にストリームを解放
  useEffect(() => stopCapture, [stopCapture]);

  const captureFrame = useCallback((): HTMLCanvasElement => {
    const video = videoRef.current;
    if (!video) {
      throw new Error("キャプチャ中ではないため、フレームを取得できません。");
    }
    return captureVideoFrame(video);
  }, []);

  const value = useMemo(
    () => ({
      state,
      error,
      notice,
      stream,
      startCapture,
      stopCapture,
      captureFrame,
    }),
    [state, error, notice, stream, startCapture, stopCapture, captureFrame],
  );

  return (
    <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>
  );
}

export function useCaptureContext() {
  const context = useContext(CaptureContext);
  if (!context) {
    throw new Error(
      "useCaptureContext は CaptureProvider 配下で使用してください。",
    );
  }
  return context;
}
