import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Section } from "./actions";

export type SectionWithThumb = Section & { thumbUrl: string | null };

const SIGNED_URL_TTL_SECONDS = 3600;

export const getSectionsByGame = cache(
  async (gameId: string): Promise<SectionWithThumb[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("game_id", gameId)
      .order("seq", { ascending: false });

    if (error) {
      throw new Error(`セクション一覧の取得に失敗しました: ${error.message}`);
    }

    const paths = data
      .map((section) => section.image_path)
      .filter((path): path is string => path !== null);

    // サムネイルは装飾扱い: 署名URLの発行に失敗しても一覧表示は継続する
    const urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage
        .from("sections")
        .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      for (const entry of signed ?? []) {
        if (!entry.error && entry.path && entry.signedUrl) {
          urlByPath.set(entry.path, entry.signedUrl);
        }
      }
    }

    return data.map((section) => ({
      ...section,
      thumbUrl: section.image_path
        ? (urlByPath.get(section.image_path) ?? null)
        : null,
    }));
  },
);
