import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * allowlist から外れたユーザーのセッションを破棄するためのルート。
 * (main)/layout.tsx の再チェックからリダイレクトされてくる。
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=denied`);
}
