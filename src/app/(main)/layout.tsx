import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import {
  SELECTED_GAME_COOKIE,
  getGames,
  resolveSelectedGame,
} from "@/lib/games/queries";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware が先に弾くが、レイアウト単体でも守る二重の保険
  if (!user) {
    redirect("/login");
  }

  const [games, cookieStore] = await Promise.all([getGames(), cookies()]);
  const selectedGame = resolveSelectedGame(
    games,
    cookieStore.get(SELECTED_GAME_COOKIE)?.value,
  );

  return (
    <>
      <Header
        email={user.email ?? ""}
        avatarUrl={user.user_metadata.avatar_url ?? null}
        games={games}
        selectedGameId={selectedGame?.id ?? null}
      />
      <main className="mx-auto w-full max-w-[1280px] px-lg py-xl">
        {children}
      </main>
    </>
  );
}
