"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { selectGame } from "@/lib/games/actions";
import type { Game } from "@/lib/games/queries";

type GameSwitcherProps = {
  games: Game[];
  selectedGameId: string | null;
};

export function GameSwitcher({ games, selectedGameId }: GameSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  if (games.length === 0) {
    return (
      <Link
        href="/settings"
        className="text-caption-md text-mute-dark transition-colors hover:text-hover-cyan"
      >
        ゲーム未登録 — 設定で登録
      </Link>
    );
  }

  const selected = games.find((game) => game.id === selectedGameId) ?? null;

  const handleSelect = (gameId: string) => {
    setIsOpen(false);
    if (gameId !== selectedGameId) {
      startTransition(() => selectGame(gameId));
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="ゲームを切り替え"
        aria-expanded={isOpen}
        disabled={isPending}
        className="flex items-center gap-xs text-heading-md text-on-dark transition-colors hover:text-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:text-mute-dark"
      >
        <span className="max-w-[320px] truncate">
          {selected?.title ?? "ゲームを選択"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4.5 L6 8.5 L10 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-1/2 top-full z-10 mt-xs w-72 -translate-x-1/2 rounded-md border border-hairline-dark bg-surface-elevated py-xs">
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => handleSelect(game.id)}
              className="flex w-full items-center gap-sm px-md py-xs text-left text-body-sm text-body-dark transition-colors hover:text-hover-cyan"
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  game.id === selectedGameId ? "bg-primary" : "bg-transparent"
                }`}
              />
              <span className="truncate">{game.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
