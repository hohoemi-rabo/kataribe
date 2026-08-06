"use client";

import { useMemo, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ICON_BUTTON_CLASS } from "@/components/player-bar";
import { formatDateTimeJa } from "@/lib/format";
import { usePlayer } from "@/lib/player/player-context";
import { deleteSection, updateSectionContent } from "@/lib/sections/actions";
import type { SectionWithThumb } from "@/lib/sections/queries";

type SortOrder = "newest" | "oldest";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];

function presetLabel(presetName: string): string {
  return presetName === "manual" ? "手動範囲" : presetName;
}

export function SectionsList({ sections }: { sections: SectionWithThumb[] }) {
  const { play } = usePlayer();
  const [order, setOrder] = useState<SortOrder>("newest");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SectionWithThumb | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    return [...sections].sort((a, b) =>
      order === "newest" ? b.seq - a.seq : a.seq - b.seq,
    );
  }, [sections, order]);

  const handleSave = (section: SectionWithThumb) => {
    setError(null);
    startTransition(async () => {
      const result = await updateSectionContent(section.id, editValue);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSection(deleteTarget.id);
      if (result.error) {
        setError(result.error);
      } else {
        setDeleteTarget(null);
      }
    });
  };

  if (sections.length === 0) {
    return (
      <p className="text-body-md text-mute-dark">
        まだセクションがありません。メイン画面で読み取ると、ここに蓄積されます。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-xs" role="group" aria-label="並び順">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setOrder(option.value)}
            aria-pressed={order === option.value}
            className={`h-9 rounded-full px-md text-caption-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              order === option.value
                ? "bg-on-dark text-canvas"
                : "bg-[rgba(255,255,255,0.08)] text-body-dark hover:text-hover-cyan"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && !deleteTarget && (
        <p role="alert" className="text-caption-md text-warning">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-md">
        {sorted.map((section) => {
          const isEditing = editingId === section.id;
          return (
            <li
              key={section.id}
              className="flex flex-col gap-md rounded-md bg-surface-card p-lg transition-colors hover:bg-surface-hover lg:flex-row lg:gap-lg"
            >
              <div className="w-full shrink-0 lg:w-[240px]">
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-[#0d0d0e]">
                  {section.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={section.thumbUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-caption-sm text-mute-dark">
                      画像なし
                    </span>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-xs">
                <div className="flex items-center gap-sm">
                  <span className="rounded-full bg-primary px-[10px] py-xxs text-caption-sm text-on-primary">
                    #{section.seq}
                  </span>
                  <span className="text-caption-md text-mute-dark">
                    {formatDateTimeJa(section.created_at)}・
                    {presetLabel(section.preset_name)}
                  </span>
                </div>

                {isEditing ? (
                  <>
                    <textarea
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      rows={8}
                      autoFocus
                      className="w-full rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md py-sm text-body-sm leading-relaxed text-on-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex items-center gap-sm pt-xs">
                      <button
                        type="button"
                        onClick={() => handleSave(section)}
                        disabled={isPending || editValue.trim().length === 0}
                        className="h-9 shrink-0 rounded-full bg-primary px-md text-button-md text-on-primary transition duration-150 ease-out hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:bg-surface-hover disabled:text-mute-dark"
                      >
                        {isPending ? "保存中…" : "保存"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        disabled={isPending}
                        className="h-9 shrink-0 rounded-full border border-hairline-dark px-md text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="line-clamp-3 text-body-md text-body-dark">
                      {section.content}
                    </p>
                    <div className="flex items-center gap-md pt-xs">
                      <button
                        type="button"
                        onClick={() =>
                          void play(
                            `#${section.seq} ${presetLabel(section.preset_name)}`,
                            section.content,
                          )
                        }
                        aria-label="もう一度読み上げ"
                        className={ICON_BUTTON_CLASS}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          aria-hidden="true"
                        >
                          <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEditingId(section.id);
                          setEditValue(section.content);
                        }}
                        className="text-caption-md text-body-dark transition-colors hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setDeleteTarget(section);
                        }}
                        className="text-caption-md text-warning transition-colors hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {deleteTarget && (
        <ConfirmDialog
          titleId="delete-section-title"
          title={`#${deleteTarget.seq} のセクションを削除しますか？`}
          description="本文と切り抜き画像を削除します。この操作は取り消せません（連番は振り直されません）。"
          error={error}
          isPending={isPending}
          onCancel={() => {
            setError(null);
            setDeleteTarget(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
