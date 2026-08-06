"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDateJa } from "@/lib/format";
import { deleteGame } from "@/lib/games/actions";
import type { Game } from "@/lib/games/queries";

export function GameList({ games }: { games: Game[] }) {
  const [target, setTarget] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!target) return;
    startTransition(async () => {
      const result = await deleteGame(target.id);
      if (result.error) {
        setError(result.error);
      } else {
        setTarget(null);
      }
    });
  };

  if (games.length === 0) {
    return (
      <p className="text-body-sm text-mute-dark">
        まだゲームが登録されていません。
      </p>
    );
  }

  return (
    <>
      <ul>
        {games.map((game) => (
          <li
            key={game.id}
            className="flex items-center justify-between gap-md border-b border-hairline-dark py-md"
          >
            <div className="flex min-w-0 flex-col gap-xxs">
              <span className="truncate text-body-sm text-on-dark">
                {game.title}
              </span>
              <span className="text-caption-md text-mute-dark">
                {formatDateJa(game.created_at)} 登録
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setTarget(game);
              }}
              className="h-9 shrink-0 rounded-full border border-warning px-md text-button-md text-warning transition-colors hover:bg-warning hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              削除
            </button>
          </li>
        ))}
      </ul>

      {target && (
        <ConfirmDialog
          titleId="delete-game-title"
          title={`「${target.title}」を削除しますか？`}
          description="配下のプリセット・セクション・あらすじもすべて削除されます。この操作は取り消せません。"
          error={error}
          isPending={isPending}
          onCancel={() => setTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
