import { getGames } from "@/lib/games/queries";
import { AddGameForm } from "./add-game-form";
import { GameList } from "./game-list";

export default async function SettingsPage() {
  const games = await getGames();

  return (
    <div className="flex flex-col gap-xxl">
      <h1 className="text-display-md">設定</h1>
      <section className="flex flex-col gap-lg">
        <h2 className="text-heading-xl">ゲーム管理</h2>
        <AddGameForm />
        <GameList games={games} />
      </section>
    </div>
  );
}
