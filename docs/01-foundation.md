# 01 — プロジェクト基盤

## 目的

Supabase 接続・Google OAuth・allowlist・デザイン基盤（トークン / フォント / 共通レイアウト）を整え、「許可された本人だけがログインできるダークUIの土台」を完成させる。

- 参照: REQUIREMENTS.md §2（技術スタック）・§2.1（認証）、DESIGN.md §1〜§5・§6（ログイン）
- 依存: なし（最初のチケット）

## Todo

### 環境・接続

- [ ] Supabase プロジェクトを作成し、URL / publishable key を `.env.local` に設定（`.env.example` も作成）
- [ ] `@supabase/supabase-js` + `@supabase/ssr` を導入し、ブラウザ用 / サーバー用クライアントヘルパーを作成（Next.js 15 のため `await cookies()` で実装すること）
- [ ] middleware でセッションリフレッシュ + 未ログイン時 `/login` リダイレクト

### 認証

- [ ] Google Cloud Console で OAuth クライアント作成、Supabase Auth に Google プロバイダ設定
- [ ] Google ログイン実装(`/login` → OAuth → コールバック)
- [ ] **allowlist**: 環境変数 `ALLOWED_EMAILS` に一致しないアカウントはログイン後に強制サインアウト + 拒否メッセージ表示
- [ ] ログアウト機能

### デザイン基盤

- [ ] `tailwind.config.ts` に DESIGN.md §1 のカラートークン（primary / hover-cyan / canvas / surface-elevated / surface-card / on-dark / body-dark / mute-dark / hairline-dark / warning / gold-\*）を登録
- [ ] DESIGN.md §2 のタイポグラフィスケール・§3 の rounded / spacing を登録
- [ ] Noto Sans JP を `next/font` で導入（weight 300 / 400 / 500 / 600 / 700）
- [ ] ルートレイアウト: 背景 `#000000`、ヘッダー（ワードマーク「KATARIBE」weight 300 / letter-spacing 0.35em、ナビリンク: メイン / セクション / あらすじ / 設定、アバター32px）
- [ ] ログイン画面: 全面黒、display-lg ワードマーク + タグライン「カタリベ — あなただけの語り部」+ button-primary「Googleでログイン」の3要素のみ
- [ ] ブラウザタイトル「KATARIBE」+ favicon（黒 squircle に白「K」weight 300、右下に primary ドット）

### 動作確認

- [ ] 許可メールアドレスの Google アカウントでログイン → メイン画面に到達できる
- [ ] 許可外アカウントは弾かれ、拒否メッセージが表示される
- [ ] 未ログインでメイン画面 URL に直接アクセス → `/login` へリダイレクト

## メモ

- Tailwind は **v3.4.17 固定**。v4 の記法（`@theme` 等）を持ち込まない
- ボタン等のコンポーネント実装はこのチケットでは最小限（ログインボタンのみ）でよい。共通コンポーネント化は使う画面のチケットで行う
