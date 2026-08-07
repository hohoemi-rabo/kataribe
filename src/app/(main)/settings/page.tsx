import { getGames } from "@/lib/games/queries";
import { getAllPresets } from "@/lib/presets/queries";
import { AutoPlayToggle } from "@/components/autoplay-toggle";
import { AddGameForm } from "./add-game-form";
import { GameList } from "./game-list";
import { PresetList } from "./preset-list";
import { SpeedSetting } from "./speed-setting";

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
      <section className="flex flex-col gap-lg">
        <h2 className="text-heading-xl">読み上げ設定</h2>
        <SpeedSetting />
        <div className="flex flex-col gap-sm">
          <AutoPlayToggle />
          <p className="text-caption-md text-mute-dark">
            オフにすると読み取り後に音声は流れません。メイン画面の直近結果やセクション一覧の「読み上げ」ボタンで、好きなタイミングで聞けます。
          </p>
        </div>
      </section>
    </div>
  );
}
