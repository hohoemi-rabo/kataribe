"use client";

import { useState, useTransition } from "react";
import { PresetModal } from "@/components/preset-modal";
import { useCaptureContext } from "@/lib/capture/capture-context";
import { formatDateJa } from "@/lib/format";
import type { Game } from "@/lib/games/queries";
import { deletePreset, renamePreset } from "@/lib/presets/actions";
import type { Preset } from "@/lib/presets/queries";

type PresetListProps = {
  games: Game[];
  presets: Preset[];
};

export function PresetList({ games, presets }: PresetListProps) {
  const { state, captureFrame } = useCaptureContext();
  const isCapturing = state === "capturing";
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editTarget, setEditTarget] = useState<{
    preset: Preset;
    frame: HTMLCanvasElement;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Preset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (games.length === 0) {
    return <p className="text-body-sm text-mute-dark">ゲームが未登録です。</p>;
  }

  const handleRename = (preset: Preset) => {
    setError(null);
    startTransition(async () => {
      const result = await renamePreset(preset.id, renameValue);
      if (result.error) {
        setError(result.error);
      } else {
        setRenameId(null);
      }
    });
  };

  const handleReRegister = (preset: Preset) => {
    setError(null);
    try {
      setEditTarget({ preset, frame: captureFrame() });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "フレームの取得に失敗しました。",
      );
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePreset(deleteTarget.id);
      if (result.error) {
        setError(result.error);
      } else {
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-lg">
      {!isCapturing && (
        <p className="text-caption-md text-mute-dark">
          範囲の再登録はキャプチャ中のみ可能です（メイン画面でキャプチャを開始したまま設定を開いてください）
        </p>
      )}
      {error && (
        <p role="alert" className="text-caption-md text-warning">
          {error}
        </p>
      )}

      {games.map((game) => {
        const gamePresets = presets.filter(
          (preset) => preset.game_id === game.id,
        );
        return (
          <div key={game.id} className="flex flex-col gap-xs">
            <h3 className="text-heading-md">{game.title}</h3>
            {gamePresets.length === 0 ? (
              <p className="text-caption-md text-mute-dark">プリセットなし</p>
            ) : (
              <ul>
                {gamePresets.map((preset) => (
                  <li
                    key={preset.id}
                    className="flex items-center justify-between gap-md border-b border-hairline-dark py-md"
                  >
                    {renameId === preset.id ? (
                      <div className="flex min-w-0 flex-1 items-center gap-sm">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(event) =>
                            setRenameValue(event.target.value)
                          }
                          maxLength={100}
                          autoFocus
                          className="h-12 w-full max-w-[320px] rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md text-body-sm text-on-dark focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleRename(preset)}
                          disabled={
                            isPending || renameValue.trim().length === 0
                          }
                          className="h-9 shrink-0 rounded-full bg-primary px-md text-button-md text-on-primary transition duration-150 ease-out hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-surface-hover disabled:text-mute-dark"
                        >
                          {isPending ? "保存中…" : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenameId(null)}
                          disabled={isPending}
                          className="h-9 shrink-0 rounded-full border border-hairline-dark px-md text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                        >
                          キャンセル
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex min-w-0 flex-col gap-xxs">
                          <span className="truncate text-body-sm text-on-dark">
                            {preset.name}
                          </span>
                          <span className="text-caption-md text-mute-dark">
                            {formatDateJa(preset.created_at)} 登録
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-md">
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setRenameId(preset.id);
                              setRenameValue(preset.name);
                            }}
                            className="text-caption-md text-body-dark transition-colors hover:text-hover-cyan"
                          >
                            名前変更
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReRegister(preset)}
                            disabled={!isCapturing}
                            title={!isCapturing ? "キャプチャ中のみ" : undefined}
                            className="text-caption-md text-body-dark transition-colors hover:text-hover-cyan disabled:text-mute-dark disabled:hover:text-mute-dark"
                          >
                            範囲を再登録
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setDeleteTarget(preset);
                            }}
                            className="text-caption-md text-warning transition-colors hover:text-hover-cyan"
                          >
                            削除
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {editTarget && (
        <PresetModal
          mode="edit-rect"
          frame={editTarget.frame}
          preset={editTarget.preset}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-preset-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-lg"
        >
          <div className="flex w-full max-w-[480px] flex-col gap-lg rounded-lg bg-surface-elevated p-xl">
            <h3 id="delete-preset-title" className="text-heading-lg">
              「{deleteTarget.name}」を削除しますか？
            </h3>
            <p className="text-body-sm text-body-dark">
              このプリセットを削除します。登録済みのセクションには影響しません。
            </p>
            <div className="flex justify-end gap-sm">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isPending}
                className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="h-12 rounded-full border border-warning px-lg text-button-md text-warning transition-colors hover:bg-warning hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
              >
                {isPending ? "削除中…" : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
