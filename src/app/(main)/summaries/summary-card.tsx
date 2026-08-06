"use client";

import { ICON_BUTTON_CLASS } from "@/components/player-bar";

// ゴールドは summary-card 専用（DESIGN.md）。ゴールド系クラスはこのファイル以外で使わない
const GOLD_BAR_STATIC =
  "h-1 w-full bg-gradient-to-r from-gold-start via-gold-mid to-gold-end";
const GOLD_BAR_SHIMMER = `${GOLD_BAR_STATIC} bg-[length:200%_100%] animate-gold-shimmer`;

function PlayButton({ onPlay }: { onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label="あらすじを読み上げ"
      className={ICON_BUTTON_CLASS}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4 2 L14 8 L4 14 Z" fill="currentColor" />
      </svg>
    </button>
  );
}

export function SummaryCardGenerating() {
  return (
    <article className="overflow-hidden rounded-md bg-surface-elevated">
      <div className={GOLD_BAR_SHIMMER} aria-hidden="true" />
      <div className="flex flex-col gap-lg px-xl py-xxl">
        <h2 className="text-heading-xl">ここまでのあらすじ</h2>
        <p role="status" className="text-body-md text-mute-dark">
          あらすじを生成中…
        </p>
      </div>
    </article>
  );
}

function DeleteLink({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      className="text-caption-md text-warning transition-colors hover:text-hover-cyan"
    >
      削除
    </button>
  );
}

type SummaryCardHeroProps = {
  meta: string;
  content: string;
  onPlay: () => void;
  onDelete?: () => void;
};

export function SummaryCardHero({
  meta,
  content,
  onPlay,
  onDelete,
}: SummaryCardHeroProps) {
  return (
    <article className="overflow-hidden rounded-md bg-surface-elevated">
      <div className={GOLD_BAR_STATIC} aria-hidden="true" />
      <div className="flex flex-col gap-lg px-xl py-xxl">
        <div className="flex items-center justify-between gap-md">
          <h2 className="text-heading-xl">ここまでのあらすじ</h2>
          <div className="flex items-center gap-md">
            <PlayButton onPlay={onPlay} />
            {onDelete && <DeleteLink onDelete={onDelete} />}
          </div>
        </div>
        <p className="text-caption-md text-mute-dark">{meta}</p>
        <p className="max-w-[640px] whitespace-pre-wrap text-body-md text-body-dark">
          {content}
        </p>
      </div>
    </article>
  );
}

type SummaryCardCompactProps = {
  meta: string;
  content: string;
  expanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onDelete: () => void;
};

export function SummaryCardCompact({
  meta,
  content,
  expanded,
  onToggle,
  onPlay,
  onDelete,
}: SummaryCardCompactProps) {
  return (
    <article className="overflow-hidden rounded-md bg-surface-elevated">
      <div className={GOLD_BAR_STATIC} aria-hidden="true" />
      <div className="flex flex-col gap-sm p-lg">
        <div className="flex items-center justify-between gap-md">
          <p className="text-caption-md text-mute-dark">{meta}</p>
          <div className="flex items-center gap-md">
            <PlayButton onPlay={onPlay} />
            <DeleteLink onDelete={onDelete} />
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <p
            className={`max-w-[640px] whitespace-pre-wrap text-body-md text-body-dark ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {content}
          </p>
        </button>
      </div>
    </article>
  );
}
