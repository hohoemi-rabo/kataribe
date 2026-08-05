"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Section = Tables<"sections">;

type CreateSectionResult = { section?: Section; error?: string };

export async function createSection(
  gameId: string,
  presetName: string,
  content: string,
  imagePath: string | null,
): Promise<CreateSectionResult> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: "保存するテキストがありません。" };
  }

  const supabase = await createClient();

  // ゲームごとに max(seq) + 1 で採番（利用者1人のため同時書き込みは想定しない）
  const { data: latest, error: seqError } = await supabase
    .from("sections")
    .select("seq")
    .eq("game_id", gameId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seqError) {
    return { error: "連番の取得に失敗しました。時間をおいて再度お試しください。" };
  }

  const { data, error } = await supabase
    .from("sections")
    .insert({
      game_id: gameId,
      seq: (latest?.seq ?? 0) + 1,
      preset_name: presetName,
      content: trimmedContent,
      image_path: imagePath,
    })
    .select("*")
    .single();

  if (error) {
    return {
      error: "セクションの保存に失敗しました。時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/", "layout");
  return { section: data };
}
