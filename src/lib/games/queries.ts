import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Game = Tables<"games">;

export const SELECTED_GAME_COOKIE = "kataribe-selected-game";

// layout とページの両方から呼ばれるため cache() でリクエスト内デデュープ
export const getGames = cache(async (): Promise<Game[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`ゲーム一覧の取得に失敗しました: ${error.message}`);
  }
  return data;
});

/** cookie の指すゲームが消えている場合は最新のゲームへフォールバック */
export function resolveSelectedGame(
  games: Game[],
  cookieValue: string | undefined,
): Game | null {
  if (games.length === 0) return null;
  return games.find((game) => game.id === cookieValue) ?? games[0];
}
