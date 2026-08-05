# 05 — Worker: transcribe + セクション保存

## 目的

Cloudflare Worker を立ち上げ、切り抜き画像 → テキスト化（Gemini Vision）→ セクション保存 → 画面表示までの「読んで」フローを完成させる。

- 参照: REQUIREMENTS.md §3.3・§3.4（保存部分）・§6、DESIGN.md §6（メイン: 読み取り中フィードバック）
- 依存: 03, 04

## Todo

### Worker 基盤

- [ ] `worker/` ディレクトリに Cloudflare Workers プロジェクトを作成（wrangler + TypeScript）
- [ ] Supabase JWT 検証ミドルウェア（`Authorization: Bearer` を検証。失敗は 401）
- [ ] Gemini API キーを Worker の環境変数（secret）に設定。**フロントに一切出さない**
- [ ] CORS 設定（アプリのオリジンのみ許可）

### POST /transcribe

- [ ] Gemini の Vision 対応 **最新安定版モデル ID を確認** して採用（コード内で定数化）
- [ ] リクエスト: 切り抜き画像（base64）→ Gemini へ送信 → 本文テキストを返す
- [ ] 固定プロンプト（Worker 側で付与）: 「本文テキストのみを忠実に書き起こす」「UI要素・ボタンラベル・メニュー項目・スクロールバー等は無視」「日本語は日本語のまま。要約・意訳をしない」
- [ ] Gemini 失敗時は明確なエラーレスポンス（フロントでユーザーに表示できる形）

### フロント: 「読んで」フロー

- [ ] プリセットボタン押下 → 現在フレーム取得 → 相対座標を実ピクセルに変換して canvas で切り抜き
- [ ] 切り抜き画像を Worker `/transcribe` へ送信（Supabase セッションの JWT を付与）
- [ ] Supabase Storage にバケット（例: `sections`）を作成し、切り抜き画像を保存（RLS/ポリシーで本人のみ）
- [ ] `sections` に insert: `seq = max(seq) + 1`（ゲームごと）、`preset_name`、`content`、`image_path`
- [ ] **読み取り中フィードバック**: 押したボタンをラベル「読み取り中…」+ ピル内左端スピナーに変化。完了で元に戻す
- [ ] **テキスト先出し**: テキスト化完了時点で直近の読み取り結果エリア（section-card、本文 clamp なし）に即表示（TTS はチケット07）
- [ ] 失敗時: エラーメッセージ表示（warning 色）。セクションは保存しない

### 動作確認

- [ ] 実ゲーム画面のジャーナルを読ませて、本文だけが書き起こされる（UI 文字列が混入しない）
- [ ] セクションが連番で保存され、Storage にサムネ画像が入る
- [ ] JWT なし・不正 JWT で Worker が 401 を返す

## メモ

- Worker の URL は環境変数（`NEXT_PUBLIC_WORKER_URL`）でフロントに渡す
- レート制限はチケット10で追加（このチケットでは実装しない）
