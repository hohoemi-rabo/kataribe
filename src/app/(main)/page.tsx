import Link from "next/link";
import { getGames } from "@/lib/games/queries";
import { CapturePanel } from "./capture-panel";

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
    <div className="grid gap-lg lg:grid-cols-[3fr_2fr]">
      <CapturePanel />
      <div>
        <p className="text-caption-md text-mute-dark">
          プリセットボタン（チケット04で実装）
        </p>
      </div>
    </div>
  );
}
