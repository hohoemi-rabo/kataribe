/**
 * ALLOWED_EMAILS（カンマ区切り・サーバー専用環境変数）との照合。
 * 個人利用前提のため、許可外アカウントはログイン後に必ず弾く。
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email.toLowerCase());
}
