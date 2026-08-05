import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { PlayerBar } from "@/components/player-bar";
import { CaptureProvider } from "@/lib/capture/capture-context";
import { PlayerProvider } from "@/lib/player/player-context";
import { getGames, getSelectedGame } from "@/lib/games/queries";
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

  const [games, selectedGame] = await Promise.all([
    getGames(),
    getSelectedGame(),
  ]);

  return (
    <>
      <Header
        email={user.email ?? ""}
        avatarUrl={user.user_metadata.avatar_url ?? null}
        games={games}
        selectedGameId={selectedGame?.id ?? null}
      />
      <CaptureProvider>
        <PlayerProvider>
          <main className="mx-auto w-full max-w-[1280px] px-lg py-xl pb-section">
            {children}
          </main>
          <PlayerBar />
        </PlayerProvider>
      </CaptureProvider>
    </>
  );
}
