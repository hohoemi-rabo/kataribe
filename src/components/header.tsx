import Link from "next/link";
import { GameSwitcher } from "./game-switcher";
import { UserMenu } from "./user-menu";
import type { Game } from "@/lib/games/queries";

const NAV_LINKS = [
  { href: "/", label: "メイン" },
  { href: "/sections", label: "セクション" },
  { href: "/summaries", label: "あらすじ" },
  { href: "/settings", label: "設定" },
];

type HeaderProps = {
  email: string;
  avatarUrl: string | null;
  games: Game[];
  selectedGameId: string | null;
};

export function Header({ email, avatarUrl, games, selectedGameId }: HeaderProps) {
  return (
    <header className="grid h-14 grid-cols-[1fr_auto_1fr] items-center bg-canvas px-lg">
      <Link
        href="/"
        className="justify-self-start text-[18px] font-light leading-tight tracking-wordmark text-on-dark transition-colors hover:text-hover-cyan"
      >
        KATARIBE
      </Link>
      <GameSwitcher games={games} selectedGameId={selectedGameId} />
      <div className="flex items-center gap-lg justify-self-end">
        <nav className="flex items-center gap-lg">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-body-sm text-body-dark transition-colors hover:text-hover-cyan"
            >
              {label}
            </Link>
          ))}
        </nav>
        <UserMenu email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
