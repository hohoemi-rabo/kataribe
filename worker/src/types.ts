export type Env = {
  SUPABASE_URL: string;
  ALLOWED_EMAILS: string;
  /** カンマ区切りの許可オリジン一覧（localhost + 本番。Origin ヘッダーと完全一致） */
  ALLOWED_ORIGIN: string;
  /** wrangler secret。フロントには一切出さない */
  GEMINI_API_KEY: string;
  /** レート制限カウンタ（JST 日次リセット） */
  RATE_LIMIT_KV: KVNamespace;
  RATE_LIMIT_TRANSCRIBE: string;
  RATE_LIMIT_SUMMARIZE: string;
  RATE_LIMIT_TTS: string;
};
