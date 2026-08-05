import Link from "next/link";
import { getGames } from "@/lib/games/queries";

export default async function HomePage() {
  const games = await getGames();

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-start gap-lg">
        <p className="text-body-md text-body-dark">
          まずゲームを登録してください。
        </p>
        <Link
          href="/settings"
          className="flex h-14 items-center rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed"
        >
          設定でゲームを登録
        </Link>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full max-w-[768px] items-center justify-center rounded-md bg-surface-elevated">
      <p className="text-body-sm text-mute-dark">
        キャプチャ画面はチケット03で実装予定
      </p>
    </div>
  );
}
