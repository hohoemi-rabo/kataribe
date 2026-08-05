"use client";

import { useActionState } from "react";
import { createGame, type ActionState } from "@/lib/games/actions";

const initialState: ActionState = {};

export function AddGameForm() {
  const [state, formAction, isPending] = useActionState(createGame, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-xs">
      <div className="flex items-center gap-sm">
        <input
          type="text"
          name="title"
          placeholder="ゲームタイトル"
          maxLength={100}
          required
          className="h-12 w-full max-w-[400px] rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md text-body-sm text-on-dark placeholder:text-mute-dark focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-14 shrink-0 rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
        >
          {isPending ? "登録中…" : "登録"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-caption-md text-warning">
          {state.error}
        </p>
      )}
    </form>
  );
}
