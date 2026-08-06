"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[1280px] flex-col items-start justify-center gap-lg px-lg">
      <h1 className="text-display-md">問題が発生しました</h1>
      <p className="text-body-md text-body-dark">
        データの取得に失敗しました。再読み込みしても解決しない場合は、時間をおいてお試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="flex h-14 items-center rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed"
      >
        再読み込み
      </button>
    </div>
  );
}
