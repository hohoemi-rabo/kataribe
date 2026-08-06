"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SELECTED_GAME_COOKIE } from "./queries";

export type ActionState = { error?: string };

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

async function setSelectedGameCookie(gameId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SELECTED_GAME_COOKIE, gameId, {
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

export async function createGame(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "タイトルを入力してください。" };
  }
  if (title.length > 100) {
    return { error: "タイトルは100文字以内で入力してください。" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .insert({ title })
    .select("id")
    .single();

  if (error) {
    return { error: "登録に失敗しました。時間をおいて再度お試しください。" };
  }

  // 未選択（初回登録など）なら、そのまま選択状態にする
  const cookieStore = await cookies();
  if (!cookieStore.get(SELECTED_GAME_COOKIE)) {
    await setSelectedGameCookie(data.id);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function selectGame(gameId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle();

  if (error) {
    return {
      error: "ゲームの切り替えに失敗しました。時間をおいて再度お試しください。",
    };
  }
  // 存在しない・所有していない ID（RLS で他人の行は見えない）
  if (!data) {
    return {
      error: "このゲームが見つかりません。画面を再読み込みしてください。",
    };
  }

  await setSelectedGameCookie(gameId);
  return {};
}

export async function deleteGame(gameId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", gameId);

  if (error) {
    return { error: "削除に失敗しました。時間をおいて再度お試しください。" };
  }

  // 選択中のゲームを消した場合は cookie を破棄（次回描画で最新ゲームへフォールバック）
  const cookieStore = await cookies();
  if (cookieStore.get(SELECTED_GAME_COOKIE)?.value === gameId) {
    cookieStore.delete(SELECTED_GAME_COOKIE);
  }

  revalidatePath("/", "layout");
  return {};
}
