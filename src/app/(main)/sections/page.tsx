import Link from "next/link";
import { getSelectedGame } from "@/lib/games/queries";
import { getSectionsByGame } from "@/lib/sections/queries";
import { SectionsList } from "./sections-list";

export default async function SectionsPage() {
  const selectedGame = await getSelectedGame();

  if (!selectedGame) {
    return (
      <div className="flex flex-col items-start gap-lg">
        <h1 className="text-display-md">セクション</h1>
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

  const sections = await getSectionsByGame(selectedGame.id);

  return (
    <div className="flex flex-col gap-lg">
      <h1 className="text-display-md">セクション</h1>
      <SectionsList sections={sections} />
    </div>
  );
}
