import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Summary } from "./actions";

export const getSummariesByGame = cache(
  async (gameId: string): Promise<Summary[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("summaries")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`あらすじ一覧の取得に失敗しました: ${error.message}`);
    }
    return data;
  },
);
