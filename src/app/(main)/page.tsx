import Link from "next/link";
import { getGames, getSelectedGame } from "@/lib/games/queries";
import { getPresetsByGame } from "@/lib/presets/queries";
import { CapturePanel } from "./capture-panel";
import { PresetPanel } from "./preset-panel";

export default async function HomePage() {
  const [games, selectedGame] = await Promise.all([
    getGames(),
    getSelectedGame(),
  ]);

  if (games.length === 0 || !selectedGame) {
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

  const presets = await getPresetsByGame(selectedGame.id);

  return (
    <div className="grid items-start gap-lg lg:grid-cols-[3fr_2fr]">
      <CapturePanel />
      <PresetPanel gameId={selectedGame.id} presets={presets} />
    </div>
  );
}
