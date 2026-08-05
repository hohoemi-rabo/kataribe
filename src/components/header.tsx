import Link from "next/link";
import { UserMenu } from "./user-menu";

const NAV_LINKS = [
  { href: "/", label: "メイン" },
  { href: "/sections", label: "セクション" },
  { href: "/summaries", label: "あらすじ" },
  { href: "/settings", label: "設定" },
];

type HeaderProps = {
  email: string;
  avatarUrl: string | null;
};

export function Header({ email, avatarUrl }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between bg-canvas px-lg">
      <Link
        href="/"
        className="text-[18px] font-light leading-tight tracking-wordmark text-on-dark transition-colors hover:text-hover-cyan"
      >
        KATARIBE
      </Link>
      <div className="flex items-center gap-lg">
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
