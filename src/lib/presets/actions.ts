"use server";

import { revalidatePath } from "next/cache";
import { clampRect, isValidRect, type RelativeRect } from "@/lib/capture/region";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

function parseName(raw: unknown): string | null {
  const name = String(raw ?? "").trim();
  if (!name || name.length > 100) return null;
  return name;
}

/** クライアント検証を信用せず、サーバー側でも 0〜1 範囲を検証する */
function parseRect(rect: RelativeRect): RelativeRect | null {
  const values = [rect.x, rect.y, rect.w, rect.h];
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    return null;
  }
  const clamped = clampRect(rect);
  if (!isValidRect(clamped)) return null;
  return clamped;
}

export async function createPreset(
  gameId: string,
  name: unknown,
  rect: RelativeRect,
): Promise<ActionResult> {
  const parsedName = parseName(name);
  if (!parsedName) {
    return { error: "プリセット名は1〜100文字で入力してください。" };
  }
  const parsedRect = parseRect(rect);
  if (!parsedRect) {
    return { error: "選択範囲が不正です。もう一度範囲を指定してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("presets").insert({
    game_id: gameId,
    name: parsedName,
    ...parsedRect,
  });

  if (error) {
    return { error: "保存に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function renamePreset(
  presetId: string,
  name: unknown,
): Promise<ActionResult> {
  const parsedName = parseName(name);
  if (!parsedName) {
    return { error: "プリセット名は1〜100文字で入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("presets")
    .update({ name: parsedName })
    .eq("id", presetId);

  if (error) {
    return { error: "名前の変更に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function updatePresetRect(
  presetId: string,
  rect: RelativeRect,
): Promise<ActionResult> {
  const parsedRect = parseRect(rect);
  if (!parsedRect) {
    return { error: "選択範囲が不正です。もう一度範囲を指定してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("presets")
    .update(parsedRect)
    .eq("id", presetId);

  if (error) {
    return { error: "範囲の更新に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function deletePreset(presetId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("presets").delete().eq("id", presetId);

  if (error) {
    return { error: "削除に失敗しました。時間をおいて再度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {};
}
