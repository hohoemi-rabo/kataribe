"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Summary = Tables<"summaries">;

type CreateSummaryResult = { summary?: Summary; error?: string };

export async function createSummary(
  gameId: string,
  fromSeq: number,
  toSeq: number,
  content: string,
): Promise<CreateSummaryResult> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: "保存するあらすじがありません。" };
  }
  if (
    !Number.isInteger(fromSeq) ||
    !Number.isInteger(toSeq) ||
    fromSeq < 1 ||
    toSeq < fromSeq
  ) {
    return { error: "対象セクションの範囲が不正です。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("summaries")
    .insert({
      game_id: gameId,
      from_seq: fromSeq,
      to_seq: toSeq,
      content: trimmedContent,
    })
    .select("*")
    .single();

  if (error) {
    return {
      error: "あらすじの保存に失敗しました。時間をおいて再度お試しください。",
    };
  }

  revalidatePath("/", "layout");
  return { summary: data };
}

export async function deleteSummary(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("summaries").delete().eq("id", id);

  if (error) {
    return { error: "削除に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}
