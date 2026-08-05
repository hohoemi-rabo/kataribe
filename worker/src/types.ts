export type Env = {
  SUPABASE_URL: string;
  ALLOWED_EMAILS: string;
  ALLOWED_ORIGIN: string;
  /** wrangler secret。フロントには一切出さない */
  GEMINI_API_KEY: string;
};
