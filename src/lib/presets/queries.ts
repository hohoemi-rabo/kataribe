import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Preset = Tables<"presets">;

export const getPresetsByGame = cache(
  async (gameId: string): Promise<Preset[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("presets")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`プリセット一覧の取得に失敗しました: ${error.message}`);
    }
    return data;
  },
);

export const getAllPresets = cache(async (): Promise<Preset[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presets")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`プリセット一覧の取得に失敗しました: ${error.message}`);
  }
  return data;
});
