import { getGames } from "@/lib/games/queries";
import { getAllPresets } from "@/lib/presets/queries";
import { AddGameForm } from "./add-game-form";
import { GameList } from "./game-list";
import { PresetList } from "./preset-list";

export default async function SettingsPage() {
  const [games, presets] = await Promise.all([getGames(), getAllPresets()]);

  return (
    <div className="flex flex-col gap-xxl">
      <h1 className="text-display-md">設定</h1>
      <section className="flex flex-col gap-lg">
        <h2 className="text-heading-xl">ゲーム管理</h2>
        <AddGameForm />
        <GameList games={games} />
      </section>
      <section className="flex flex-col gap-lg">
        <h2 className="text-heading-xl">プリセット管理</h2>
        <PresetList games={games} presets={presets} />
      </section>
    </div>
  );
}
