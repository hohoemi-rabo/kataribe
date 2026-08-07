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
import { fetchTtsAudio } from "@/lib/tts/client";

export type PlayerStatus = "idle" | "loading" | "playing" | "paused";
export type PlayerEngine = "gemini" | "webspeech";

export const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

const SPEED_STORAGE_KEY = "kataribe-player-speed";
const AUTOPLAY_STORAGE_KEY = "kataribe-player-autoplay";

// デフォルト速度（設定画面で選択）は純粋にクライアント側の設定のため localStorage で永続化する
// （cookie + Server Action 方式はサーバーが値を知る必要がある場合のみ）
function loadStoredSpeed(): PlaybackSpeed {
  if (typeof window === "undefined") return 1;
  const raw = Number(window.localStorage.getItem(SPEED_STORAGE_KEY));
  return (PLAYBACK_SPEEDS as readonly number[]).includes(raw)
    ? (raw as PlaybackSpeed)
    : 1;
}

type PlayerContextValue = {
  status: PlayerStatus;
  /** 現在の読み上げ対象名（player-bar に表示） */
  title: string | null;
  engine: PlayerEngine | null;
  error: string | null;
  /** Web Speech フォールバックに切り替わった理由（429・セッション切れ等）。再生は継続する */
  notice: string | null;
  /** 現在の再生速度（Gemini 再生中は即時反映。Web Speech は次の再生から） */
  speed: PlaybackSpeed;
  /** 再生バーからの一時変更。永続化せず、リロードで defaultSpeed に戻る */
  cycleSpeed: () => void;
  /** 設定画面で選んだデフォルト速度（localStorage に永続化） */
  defaultSpeed: PlaybackSpeed;
  /** デフォルト速度を保存し、現在の再生にも即適用する */
  setDefaultSpeed: (speed: PlaybackSpeed) => void;
  /** 読み取り完了時に自動で読み上げるか（メイン画面・設定画面で共有、localStorage に永続化） */
  autoPlay: boolean;
  setAutoPlay: (on: boolean) => void;
  play: (title: string, text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * 音声再生のグローバル状態。セクション自動再生（05）・再読み上げ（08）・
 * あらすじ読み上げ（09)が同じ player-bar を使い回す。
 * Gemini TTS（WAV）失敗時は Web Speech API にフォールバックする。
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  // play() の世代管理。連打・切替時に古い非同期処理が状態を上書きしないように
  const playTokenRef = useRef(0);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [title, setTitle] = useState<string | null>(null);
  const [engine, setEngine] = useState<PlayerEngine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // SSR では localStorage を読めないため 1 で初期化し、マウント後に保存値を反映する
  // （lazy initializer で読むと設定画面の aria-pressed が hydration 不一致になる）
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [defaultSpeed, setDefaultSpeedState] = useState<PlaybackSpeed>(1);
  const [autoPlay, setAutoPlayState] = useState(true);
  // play/speakWithWebSpeech のコールバックを速度変更で作り直さないための参照
  const speedRef = useRef<PlaybackSpeed>(1);

  useEffect(() => {
    const stored = loadStoredSpeed();
    speedRef.current = stored;
    setSpeed(stored);
    setDefaultSpeedState(stored);
    if (window.localStorage.getItem(AUTOPLAY_STORAGE_KEY) === "0") {
      setAutoPlayState(false);
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopInternal = useCallback(() => {
    cleanupAudio();
    window.speechSynthesis?.cancel();
  }, [cleanupAudio]);

  const resetToIdle = useCallback(() => {
    setStatus("idle");
    setTitle(null);
    setEngine(null);
  }, []);

  const stop = useCallback(() => {
    playTokenRef.current += 1;
    stopInternal();
    resetToIdle();
    setError(null);
    setNotice(null);
  }, [resetToIdle, stopInternal]);

  const speakWithWebSpeech = useCallback(
    (text: string, token: number) => {
      const synth = window.speechSynthesis;
      if (!synth) {
        throw new Error("このブラウザは音声合成に対応していません。");
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      const jaVoice = synth
        .getVoices()
        .find((voice) => voice.lang.startsWith("ja"));
      if (jaVoice) utterance.voice = jaVoice;
      // 0.95 が等速時の基準（自然に聞こえる速さ）。発話開始後は変更できない
      utterance.rate = 0.95 * speedRef.current;
      utterance.onend = () => {
        if (playTokenRef.current === token) resetToIdle();
      };
      utterance.onerror = (event) => {
        // cancel() 由来の interrupted / canceled は正常系
        if (event.error === "interrupted" || event.error === "canceled") return;
        if (playTokenRef.current === token) {
          resetToIdle();
          setError("音声の再生に失敗しました。");
        }
      };
      synth.speak(utterance);
    },
    [resetToIdle],
  );

  const play = useCallback(
    async (playTitle: string, text: string) => {
      const token = ++playTokenRef.current;
      // 再生対象の切替時は前の再生を止めてから開始する
      stopInternal();
      setError(null);
      setNotice(null);
      setTitle(playTitle);
      setStatus("loading");
      setEngine(null);

      try {
        const blob = await fetchTtsAudio(text);
        if (playTokenRef.current !== token) return; // 後発の再生に置き換わった

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audio.playbackRate = speedRef.current;
        audioRef.current = audio;
        audio.onended = () => {
          if (playTokenRef.current === token) {
            cleanupAudio();
            resetToIdle();
          }
        };
        await audio.play();
        if (playTokenRef.current !== token) return;
        setEngine("gemini");
        setStatus("playing");
      } catch (err) {
        if (playTokenRef.current !== token) return;
        cleanupAudio();
        // Gemini TTS 失敗 → Web Speech API フォールバック（REQUIREMENTS §3.5）。
        // 失敗理由（429・セッション切れ等）は握りつぶさず notice で可視化する
        try {
          speakWithWebSpeech(text, token);
          setEngine("webspeech");
          setStatus("playing");
          setNotice(
            err instanceof Error
              ? err.message
              : "Gemini TTS が利用できないため代替音声で再生しています。",
          );
        } catch (fallbackErr) {
          resetToIdle();
          setError(
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "音声の再生に失敗しました。",
          );
        }
      }
    },
    [cleanupAudio, resetToIdle, speakWithWebSpeech, stopInternal],
  );

  // Gemini（WAV）再生中は即時反映。Web Speech は発話中の変更不可のため次回から
  const applySpeed = useCallback((next: PlaybackSpeed) => {
    speedRef.current = next;
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    const index = PLAYBACK_SPEEDS.indexOf(speedRef.current);
    applySpeed(PLAYBACK_SPEEDS[(index + 1) % PLAYBACK_SPEEDS.length]);
  }, [applySpeed]);

  const setDefaultSpeed = useCallback(
    (next: PlaybackSpeed) => {
      setDefaultSpeedState(next);
      try {
        window.localStorage.setItem(SPEED_STORAGE_KEY, String(next));
      } catch {
        // プライベートモード等で保存できなくても再生自体は継続する
      }
      applySpeed(next);
    },
    [applySpeed],
  );

  const setAutoPlay = useCallback((on: boolean) => {
    setAutoPlayState(on);
    try {
      window.localStorage.setItem(AUTOPLAY_STORAGE_KEY, on ? "1" : "0");
    } catch {
      // プライベートモード等で保存できなくても動作は継続する
    }
  }, []);

  const pause = useCallback(() => {
    if (status !== "playing") return;
    if (engine === "webspeech") {
      window.speechSynthesis?.pause();
    } else {
      audioRef.current?.pause();
    }
    setStatus("paused");
  }, [engine, status]);

  const resume = useCallback(() => {
    if (status !== "paused") return;
    if (engine === "webspeech") {
      window.speechSynthesis?.resume();
    } else {
      void audioRef.current?.play();
    }
    setStatus("playing");
  }, [engine, status]);

  // アンマウント時（(main) 群からの離脱）に停止
  useEffect(() => stopInternal, [stopInternal]);

  const value = useMemo(
    () => ({
      status,
      title,
      engine,
      error,
      notice,
      speed,
      cycleSpeed,
      defaultSpeed,
      setDefaultSpeed,
      autoPlay,
      setAutoPlay,
      play,
      pause,
      resume,
      stop,
    }),
    [
      status,
      title,
      engine,
      error,
      notice,
      speed,
      cycleSpeed,
      defaultSpeed,
      setDefaultSpeed,
      autoPlay,
      setAutoPlay,
      play,
      pause,
      resume,
      stop,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer は PlayerProvider 配下で使用してください。");
  }
  return context;
}
