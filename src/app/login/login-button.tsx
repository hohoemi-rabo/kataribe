"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // 成功時は Google へ遷移するため、失敗時のみ復帰させる
    if (error) {
      setIsLoading(false);
      window.location.assign("/login?error=auth");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      className="h-14 rounded-full bg-primary px-xl text-button-lg text-on-primary transition duration-150 ease-out hover:scale-[1.04] hover:bg-hover-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:bg-primary-pressed disabled:scale-100 disabled:bg-surface-hover disabled:text-mute-dark"
    >
      {isLoading ? "リダイレクト中…" : "Googleでログイン"}
    </button>
  );
}
