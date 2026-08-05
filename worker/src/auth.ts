import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "./types";

// JWKS はモジュールスコープでキャッシュ（Worker インスタンス生存中は再利用される）
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function isAllowedEmail(email: string, allowedList: string): boolean {
  const allowed = allowedList
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

/**
 * Supabase の access_token（ES256）を JWKS で検証し、
 * allowlist のメールアドレス以外は認証失敗として扱う。
 */
export async function verifyRequest(
  request: Request,
  env: Env,
): Promise<{ email: string } | null> {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  jwks ??= createRemoteJWKSet(
    new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  );

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    });
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!email || !isAllowedEmail(email, env.ALLOWED_EMAILS)) {
      return null;
    }
    return { email };
  } catch {
    return null;
  }
}
