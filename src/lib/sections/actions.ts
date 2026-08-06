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

type ActionResult = { error?: string };

export async function updateSectionContent(
  id: string,
  content: string,
): Promise<ActionResult> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { error: "本文を入力してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sections")
    .update({ content: trimmedContent })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "保存に失敗しました。時間をおいて再度お試しください。" };
  }
  if (!data) {
    return { error: "対象のセクションが見つかりませんでした。" };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deleteSection(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: section, error: fetchError } = await supabase
    .from("sections")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: "削除に失敗しました。時間をおいて再度お試しください。" };
  }
  if (!section) {
    // すでに削除済み（二重発火など）は成功扱い
    return {};
  }

  // Storage → DB 行の順に削除する。remove は対象がなくてもエラーにならないため、
  // 途中で失敗しても行が残り、再実行で削除を完遂できる
  if (section.image_path) {
    const { error: storageError } = await supabase.storage
      .from("sections")
      .remove([section.image_path]);
    if (storageError) {
      return {
        error: "画像の削除に失敗しました。時間をおいて再度お試しください。",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("sections")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: "削除に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}
