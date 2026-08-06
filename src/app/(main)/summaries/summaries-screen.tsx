"use client";

import { useState, useTransition } from "react";
import { formatDateTimeJa } from "@/lib/format";
import { usePlayer } from "@/lib/player/player-context";
import type { SectionText } from "@/lib/sections/queries";
import { createSummary, type Summary } from "@/lib/summaries/actions";
import { generateSummary } from "@/lib/summaries/client";
import {
  SummaryCardCompact,
  SummaryCardGenerating,
  SummaryCardHero,
} from "./summary-card";

type RangeMode = "all" | "range";

type UnsavedSummary = { fromSeq: number; toSeq: number; content: string };

type SummariesScreenProps = {
  gameId: string;
  gameTitle: string;
  sectionTexts: SectionText[];
  summaries: Summary[];
};

function rangeLabel(fromSeq: number, toSeq: number): string {
  return `#${fromSeq}〜#${toSeq}`;
}

export function SummariesScreen({
  gameId,
  gameTitle,
  sectionTexts,
  summaries,
}: SummariesScreenProps) {
  const { play } = usePlayer();
  const minSeq = sectionTexts[0]?.seq;
  const maxSeq = sectionTexts[sectionTexts.length - 1]?.seq;

  const [mode, setMode] = useState<RangeMode>("all");
  const [fromInput, setFromInput] = useState(() => minSeq?.toString() ?? "");
  const [toInput, setToInput] = useState(() => maxSeq?.toString() ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [freshSummary, setFreshSummary] = useState<Summary | null>(null);
  const [unsaved, setUnsaved] = useState<UnsavedSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRetrying, startRetry] = useTransition();

  const hasSections = sectionTexts.length > 0;

  // 範囲の解釈: 全部 = 全セクション。範囲指定は seq の gte/lte（欠番があっても成立）
  const from = Number.parseInt(fromInput, 10);
  const to = Number.parseInt(toInput, 10);
  const rangeInputValid =
    mode === "all" ||
    (Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to >= from);
  const targets =
    mode === "all"
      ? sectionTexts
      : rangeInputValid
        ? sectionTexts.filter(
            (section) => section.seq >= from && section.seq <= to,
          )
        : [];

  const canGenerate = hasSections && rangeInputValid && targets.length > 0;

  let notice: string | null = null;
  if (!hasSections) {
    notice =
      "セクションがまだありません。メイン画面で読み取ると、あらすじを生成できます。";
  } else if (mode === "range" && !rangeInputValid) {
    notice = "開始 ≦ 終了 となるセクション番号を入力してください。";
  } else if (mode === "range" && targets.length === 0) {
    notice = "指定した範囲にセクションがありません。";
  }

  const runGenerate = async () => {
    if (!canGenerate || isGenerating) return;
    setError(null);
    setIsGenerating(true);
    try {
      const fromSeq = targets[0].seq;
      const toSeq = targets[targets.length - 1].seq;
      const content = await generateSummary(
        gameTitle,
        targets.map((section) => section.content),
      );
      setFreshSummary(null);
      setUnsaved({ fromSeq, toSeq, content });
      const result = await createSummary(gameId, fromSeq, toSeq, content);
      if (result.summary) {
        setFreshSummary(result.summary);
        setUnsaved(null);
      } else {
        setError(result.error ?? "あらすじの保存に失敗しました。");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "あらすじの生成に失敗しました。",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const retrySave = () => {
    if (!unsaved || isRetrying) return;
    setError(null);
    startRetry(async () => {
      const result = await createSummary(
        gameId,
        unsaved.fromSeq,
        unsaved.toSeq,
        unsaved.content,
      );
      if (result.summary) {
        setFreshSummary(result.summary);
        setUnsaved(null);
      } else {
        setError(result.error ?? "あらすじの保存に失敗しました。");
      }
    });
  };

  const history = summaries.filter(
    (summary) => summary.id !== freshSummary?.id,
  );

  return (
    <div className="flex flex-col gap-xl">
      <section className="flex flex-col gap-md">
        <div className="flex flex-wrap items-center gap-md">
          <div className="flex gap-xs" role="group" aria-label="対象範囲">
            {(
              [
                { value: "all", label: "全部" },
                { value: "range", label: "範囲指定" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
                aria-pressed={mode === option.value}
                className={`h-9 rounded-full px-md text-caption-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  mode === option.value
                    ? "bg-on-dark text-canvas"
                    : "bg-[rgba(255,255,255,0.08)] text-body-dark hover:text-hover-cyan"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {mode === "range" && (
            <div className="flex items-center gap-sm">
              <input
                type="number"
                min={1}
                value={fromInput}
                onChange={(event) => setFromInput(event.target.value)}
                aria-label="開始セクション番号"
                className="h-12 w-[96px] rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md text-body-sm text-on-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-body-sm text-body-dark">〜</span>
              <input
                type="number"
                min={1}
                value={toInput}
                onChange={(event) => setToInput(event.target.value)}
                aria-label="終了セクション番号"
                className="h-12 w-[96px] rounded-sm border border-hairline-dark bg-[#0d0d0e] px-md text-body-sm text-on-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>

        {notice ? (
          <p className="text-caption-md text-mute-dark">{notice}</p>
        ) : (
          <p className="text-caption-md text-mute-dark">
            対象: {rangeLabel(targets[0].seq, targets[targets.length - 1].seq)}
            ・{targets.length}件のセクション
          </p>
        )}

        {error && (
          <p role="alert" className="text-caption-md text-warning">
            {error}
          </p>
        )}

        <div className="flex items-center gap-md">
          <button
            type="button"
            onClick={() => void runGenerate()}
            disabled={!canGenerate || isGenerating}
            className="flex h-14 items-center justify-center rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
          >
            {isGenerating ? "生成中…" : "まとめる"}
          </button>
          {unsaved && !isGenerating && (
            <button
              type="button"
              onClick={retrySave}
              disabled={isRetrying}
              className="h-12 rounded-full border border-hairline-dark px-lg text-button-md text-on-dark transition-colors hover:border-hover-cyan hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              {isRetrying ? "保存中…" : "保存を再試行"}
            </button>
          )}
        </div>
      </section>

      {isGenerating ? (
        <SummaryCardGenerating />
      ) : unsaved ? (
        <SummaryCardHero
          meta={`${rangeLabel(unsaved.fromSeq, unsaved.toSeq)}・未保存`}
          content={unsaved.content}
          onPlay={() =>
            void play(
              `あらすじ ${rangeLabel(unsaved.fromSeq, unsaved.toSeq)}`,
              unsaved.content,
            )
          }
        />
      ) : freshSummary ? (
        <SummaryCardHero
          meta={`${formatDateTimeJa(freshSummary.created_at)}・${rangeLabel(freshSummary.from_seq, freshSummary.to_seq)}`}
          content={freshSummary.content}
          onPlay={() =>
            void play(
              `あらすじ ${rangeLabel(freshSummary.from_seq, freshSummary.to_seq)}`,
              freshSummary.content,
            )
          }
        />
      ) : null}

      <section className="flex flex-col gap-md">
        <h2 className="text-heading-md">履歴</h2>
        {history.length === 0 && !freshSummary && !unsaved ? (
          <p className="text-body-sm text-mute-dark">
            まだあらすじがありません。
          </p>
        ) : history.length === 0 ? (
          <p className="text-body-sm text-mute-dark">
            過去のあらすじはありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-md">
            {history.map((summary) => (
              <li key={summary.id}>
                <SummaryCardCompact
                  meta={`${formatDateTimeJa(summary.created_at)}・${rangeLabel(summary.from_seq, summary.to_seq)}`}
                  content={summary.content}
                  expanded={expandedId === summary.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === summary.id ? null : summary.id,
                    )
                  }
                  onPlay={() =>
                    void play(
                      `あらすじ ${rangeLabel(summary.from_seq, summary.to_seq)}`,
                      summary.content,
                    )
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
