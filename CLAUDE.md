# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**KATARIBE（カタリベ）** — ゲーム内テキストの読み上げ・プレイのあらすじ生成サービス。

セカンドモニターのブラウザでゲーム画面をキャプチャし、ジャーナル等の長文テキストを Gemini でテキスト化 → TTS で朗読 → セクションとして蓄積 → 蓄積分のみを材料に「ここまでのあらすじ」を生成する。**利用者は開発者本人1人のみ**（多ユーザー化・公開はスコープ外）。

詳細仕様は 2 つのドキュメントが正:

- **REQUIREMENTS.md** — 機能要件・DB設計・Worker API・実装チケット
- **DESIGN.md** — デザイン仕様（PlayStation Design System の翻案）。デザイン判断はこちらが常に優先

## 現在のフェーズ: 運用・改善（MVP 完成済み）

**実装チケット 01〜10 はすべて完了**し、本番稼働中（2026-08 時点）。`docs/00-overview.md` と各チケットファイルは開発時の記録として残している（実装の経緯・設計判断・既知の制限のリファレンス）。

今後の変更の進め方:

- ユーザーの依頼ベースで小さく進める。**新機能や仕様変更は着手前に一言確認**する（勝手にスコープを広げない）
- まとまった機能追加になる場合は `docs/11-*.md` 以降としてチケットファイルを作り、従来の Todo 方式（`- [ ]` → 完了直後に `- [x]`、着手/完了時に `docs/00-overview.md` の表を更新）で管理する
- 軽微な修正はチケット化不要。ただし設計判断・既知の制限に触れる変更は該当 docs のメモ欄か本ファイルに記録する
- キャプチャ（`getDisplayMedia`）・音声再生に触れる変更は自動テスト不可のため、ブラウザ実機確認 → ユーザー承認を挟む

## コマンド

```bash
npm run dev     # 開発サーバー起動（Turbopack）
npm run build   # 本番ビルド（Turbopack）
npm run lint    # ESLint

# Cloudflare Worker（worker/ は独立プロジェクト。アプリの tsconfig / eslint からは除外済み）
cd worker && npm run typecheck   # 型チェック
cd worker && npx wrangler deploy # デプロイ（WSL 側で wrangler ログイン済み）
```

デプロイ:

- **アプリ（Vercel）**: `git push`（GitHub 連携で main への push が本番自動デプロイ）。CLI からは `vercel deploy --prod`（ログイン済み・プロジェクトリンク済み）
- **Worker**: `cd worker && npx wrangler deploy`。プロンプト・レート上限・CORS の変更はこれだけで反映される

テストランナーは未導入。

## 実装済みの基盤（チケット01〜10 すべて完了 = MVP 本番稼働中）

外部リソース:

- **Supabase プロジェクト**: `kataribe`（ref: `keenlwokwkmixnoczaqh`、ap-northeast-1）。同アカウントに別プロジェクト `labocore` があるため**混同しないこと**
- **本番 URL（Vercel）**: `https://kataribe-nine.vercel.app`（プロジェクト `kataribe`、CLI でリンク済み。環境変数4つ設定済み）。Supabase の Site URL / Redirect URLs も本番設定済み
- **Worker デプロイ済み**: `https://kataribe-worker.rabo-hohoemi.workers.dev`（`NEXT_PUBLIC_WORKER_URL`）。secret `GEMINI_API_KEY` 設定済み。ローカル実行時は `worker/.dev.vars`
- **レート制限（Worker/KV）**: JST 日次リセット。transcribe 50 / summarize 10 / tts 60 回/日。`worker/wrangler.toml` の `RATE_LIMIT_*` vars で調整して deploy。カウンタは KV `RATE_LIMIT_KV`（キー `rl:<email>:<endpoint>:<日付>`）
- **Gemini モデル（2026-08 に最新確認済み）**: transcribe = `gemini-3.6-flash`（generateContent）/ TTS = `gemini-3.1-flash-tts-preview`（**Interactions API** 経由、ボイス `Sulafat`、PCM→WAV 変換は `worker/src/tts.ts`）
- **Storage**: 非公開バケット `sections`（パス `<user_id>/<uuid>.jpg`、本人フォルダのみのポリシー）

実装パターン（勝手に別方式へ変えない）:

- **Worker 認証**: jose + リモート JWKS（ES256）+ `ALLOWED_EMAILS` 照合（`worker/src/auth.ts`）。CORS は `ALLOWED_ORIGIN`（カンマ区切り: localhost:3000 + 本番ドメイン、Origin 完全一致エコー）
- **選択中ゲーム**: cookie `kataribe-selected-game` + Server Action 方式（localStorage は不採用）。解決は `src/lib/games/queries.ts` の `getSelectedGame()`（cache 済み）
- **キャプチャ状態**: `CaptureProvider`（`(main)/layout.tsx` 直下・DOM 外 video 保持）。ページ遷移してもストリーム維持
- **再生状態**: `PlayerProvider` + `PlayerBar`（グローバル・下部固定）。`play(title, text)` が Gemini TTS → Web Speech フォールバックまで内包し、フォールバック理由（429 等）は `notice` として player-bar に表示される。読み上げが必要な機能は `usePlayer().play()` を呼ぶだけでよい
- **Worker 呼び出し**: `src/lib/worker-client.ts` の `workerFetch(path, body)` を共通利用（JWT 付与 + 90秒タイムアウト込み）。Worker のエラーは JSON body `{ error }` の日本語メッセージがそのまま画面に出る設計
- **データ層の規約**: 各機能は `src/lib/<機能>/` に `queries.ts`（React `cache()`・エラー時 throw）+ `actions.ts`（`"use server"`・`{ error?: string }` 返却・throw しない・`.eq("id", x)` のみで RLS 任せ・成功時 `revalidatePath("/", "layout")`）+ 必要なら `client.ts`（Worker 呼び出し）
- **セクション採番**: `src/lib/sections/actions.ts` の `createSection()` が `max(seq)+1` を実施。削除しても `seq` は振り直さない（欠番許容）
- **削除確認ダイアログ**: `src/components/confirm-dialog.tsx` を共通利用（ゲーム / プリセット / セクション / あらすじの4箇所）
- **サムネイル**: 非公開バケットのため server query で `createSignedUrls`（TTL 1時間）を一括発行 + 素の `<img>`（`next/image` 不使用）。署名失敗はプレースホルダ表示で一覧は落とさない
- **allowlist の失効**: `(main)/layout.tsx` が毎レンダーで `isAllowedEmail` を再チェック → NG は `/auth/denied`（signOut するルートハンドラ）へ
- 相対座標変換・切り抜きは `src/lib/capture/region.ts`（`RelativeRect` / `toPixelRect` / `cropCanvas`）

運用メモ:

- TTS の固有名詞誤読（例: 魔神→「まかみ」）は仕様上の限界。**セクション一覧の「編集」で本文を直す**運用（あらすじ生成の材料にもなるため重要）
- TTS の朗読スタイル指示・ボイスは `worker/src/tts.ts` の定数。変更したら `wrangler deploy` で反映。読み上げ品質の改善はコスト増になるため**ユーザー方針で現状維持**（2026-08 判断: 読んでくれれば十分）
- 429 の動作確認をしたいときは `wrangler kv key put` で `rl:<email>:<endpoint>:<JST日付>` に上限値を直接書けば即再現できる（確認後は key を削除）
- **既知の制限（意図的に未対応）**: モーダルのフォーカストラップ・Escape クローズ / キーボードのみでの範囲選択 / nav の aria-current / signOut の pending 表示 / 1024px 未満のヘッダー詰まり（詳細は docs/10-polish.md メモ欄）

## 技術スタックと固定バージョン

- **Next.js 15.5.22（App Router）+ TypeScript** — バージョン固定
- **Tailwind CSS v3.4.17** — **v4 は使わない**（意図的に v3 へダウングレード済み。`tailwind.config.ts` + `postcss.config.mjs` は v3 形式を維持すること）
- Supabase（Google OAuth + DB + Storage）/ Vercel ホスティング
- Cloudflare Workers（AI プロキシ）/ Gemini（Vision・あらすじ・TTS）

## Next.js 15 App Router ベストプラクティス

（Next.js 15.x 公式ドキュメントより。context7 で取得）

### Server / Client Components の使い分け

- コンポーネントはデフォルトで Server Component。`'use client'` はインタラクティブ性・state・effect・ブラウザ API が必要なファイルの先頭にのみ付与する（クライアント境界の宣言）
- データ取得は原則 Server Component で行い、結果を props で Client Component に渡す
- 本アプリは `getDisplayMedia` / canvas / audio などブラウザ API 中心のため Client Component が多くなるが、`'use client'` はツリーのできるだけ深い位置（境界）に置き、ページ全体をクライアント化しない
- Client Component 側でデータを待つ場合は、Server Component から Promise を渡して React の `use()` で読む（`useEffect` でのフェッチは避ける）

### Next.js 15 の破壊的変更（14 以前の知識で書かないこと）

- **`fetch` はデフォルトでキャッシュされない**（14 までの `force-cache` デフォルトから変更）。キャッシュしたい場合は明示的に `{ cache: 'force-cache' }` または `{ next: { revalidate: N } }` を付ける
- **`params` / `searchParams` は Promise**。`page.tsx` / `layout.tsx` / `generateMetadata` では必ず `await props.params` で受ける
- **`cookies()` / `headers()` も async**。`await cookies()` / `await headers()` で呼ぶ（Supabase の SSR クライアント実装時に特に注意）

### キャッシュと再検証

- タグ付け: `fetch(url, { next: { tags: ['games'] } })` → 更新時に `revalidateTag()` で無効化。パス単位なら `revalidatePath()`
- セグメント単位の制御は `export const dynamic = 'auto' | 'force-dynamic' | 'error' | 'force-static'`
- 本アプリはユーザー1人・常に最新データ表示が前提のため、基本は動的レンダリング（キャッシュ無効のデフォルト挙動）で問題ない。無理に静的化しない

### ミューテーション

- データ更新は Server Actions（`'use server'`）を第一候補にする。更新後は `revalidatePath` / `revalidateTag` で画面を同期
- Server Action 内での `cookies().set/delete` は現在ページの再レンダリングをトリガーする

## アーキテクチャ

```
ブラウザ（Next.js on Vercel）
  ├─ getDisplayMedia でゲーム画面キャプチャ → プリセット範囲で切り抜き
  ├─ Supabase: Auth（Google OAuth + allowlist）/ DB（RLS）/ Storage（切り抜き画像）
  └─ Cloudflare Worker（Supabase JWT 検証・レート制限・Gemini API キー保持）
       ├─ POST /transcribe  切り抜き画像 → 本文テキスト（Gemini Vision）
       ├─ POST /summarize   セクション群 → あらすじ（ネタバレ防止プロンプト固定）
       └─ POST /tts         テキスト → 音声（PCM→WAV 変換して返す）
```

### 重要な設計判断

- **Gemini API キーは Worker の環境変数のみ**。フロントには一切出さない。AI 呼び出しは必ず Worker 経由
- **ネタバレ防止が本サービスの存在意義**: あらすじ生成は「提供セクションのみを情報源とし、外部知識・事前知識を一切使わない」プロンプトを Worker 側で固定付与する。外部知識による補足はスコープ外
- **プリセットの矩形は相対座標（0〜1）で保存**。解像度変化にズレないため
- `sections.seq` はゲームごとに `max(seq) + 1` で採番（同時書き込みは想定しない）
- 全テーブル RLS（`user_id = auth.uid()`）+ ログイン時の許可メールアドレス allowlist（環境変数）の二重制限
- **TTS フォールバック**: Gemini TTS 失敗時は Web Speech API（ja-JP）へ。音声は保存せず都度生成
- **テキスト先出し**: テキスト化完了時点でまず画面表示し、TTS 生成を待たせない
- Gemini の TTS モデルは preview 系のため、**実装時に最新モデル ID を必ず確認**する（REQUIREMENTS.md §10）

## 対象環境

- PC 版 Chrome 最新のみ。スマホ・タブレット対応はしない（`getDisplayMedia` 前提）
- レスポンシブは 1280px 基準、1024px までの縦積み崩しのみ（DESIGN.md §8)

## デザインの絶対ルール（詳細は DESIGN.md）

- ダークキャンバス一択（`#000000` ベースの3層サーフェス）。影は使わず色差で深さを作る
- 書体は Noto Sans JP、ディスプレイ階層は weight 300。ワードマークは「KATARIBE」テキストのみ
- ホバー/フォーカスはシアン `#53b1ff` のみ。静止状態でシアンを出さない
- ゴールドは **あらすじ（summary-card）専用**。他への流用禁止
- CTA は全てピル（rounded-full）、カードは 8px。主要ボタン高さ 56px（離れて押す前提）

## その他

- `.mcp.json` は Supabase アクセストークンを含むため gitignore 済み。コミットしないこと
