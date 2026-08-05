# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**KATARIBE（カタリベ）** — ゲーム内テキストの読み上げ・プレイのあらすじ生成サービス。

セカンドモニターのブラウザでゲーム画面をキャプチャし、ジャーナル等の長文テキストを Gemini でテキスト化 → TTS で朗読 → セクションとして蓄積 → 蓄積分のみを材料に「ここまでのあらすじ」を生成する。**利用者は開発者本人1人のみ**（多ユーザー化・公開はスコープ外）。

詳細仕様は 2 つのドキュメントが正:

- **REQUIREMENTS.md** — 機能要件・DB設計・Worker API・実装チケット
- **DESIGN.md** — デザイン仕様（PlayStation Design System の翻案）。デザイン判断はこちらが常に優先

## セッション開始時の手順

1. `docs/00-overview.md` の状態表で現在のチケットを確認する（**進捗の単一情報源はこの表と各チケットの Todo**。会話履歴に頼らない）
2. 「進行中」のチケットがあればそのファイルを読み、未完了の Todo（`- [ ]`）から再開する
3. すべて「未着手」なら `docs/01-foundation.md` から。新しいチケットへの着手はユーザーに一言確認してから始める

## 開発プロセス（必須）

- 実装チケットは **`docs/` 配下に分割済み**（`docs/00-overview.md` が一覧）。**チケット番号順（01→10）に、1チケットずつ承認を挟んで** 進める。勝手に先のチケットへ進まない
- 各チケット完了ごとに動作確認 → ユーザー承認 → 次へ
- チケット03・04・06 は `getDisplayMedia` が自動テスト不可のため、ブラウザ実機確認が必須

### チケットの Todo 管理ルール

- チケット着手時: 該当ファイル（例 `docs/01-foundation.md`）を読み、`docs/00-overview.md` の状態を「進行中」に更新する
- 各 Todo は完了するたびに `- [ ]` → `- [x]` に更新する（チェックはタスク完了の直後に入れる。まとめて後から入れない）
- 作業中に判明した追加タスクは、該当チケットの Todo に `- [ ]` で追記してから着手する
- チケット内の全 Todo が `- [x]` になったら動作確認 → ユーザー承認を得て、`docs/00-overview.md` の状態を「完了」に更新する

## コマンド

```bash
npm run dev     # 開発サーバー起動（Turbopack）
npm run build   # 本番ビルド（Turbopack）
npm run lint    # ESLint
```

テストランナーは未導入。

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
