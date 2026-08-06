# 10 — 仕上げ（レート制限・エラーハンドリング・磨き込み）

## 目的

暴走保険のレート制限、全体のエラーハンドリング、状態表示の磨き込み、本番デプロイを行い MVP を完成させる。

- 参照: REQUIREMENTS.md §4・§6・§10、DESIGN.md 全般
- 依存: 01〜09 すべて

## Todo

### レート制限（Worker）

- [x] JST 日次リセット方式のレート制限を実装（初期値: transcribe 50回/日、summarize 10回/日、tts 60回/日。調整可能に）
- [ ] 上限到達時は 429 + 残り回数情報を返し、フロントで分かりやすく表示

### エラーハンドリング総点検

- [x] Worker 呼び出しのタイムアウト設定と、ネットワーク失敗時のリトライまたは明確なエラー表示（90秒タイムアウト + 再試行はボタン再押下）
- [x] Gemini API 失敗時のメッセージ（transcribe / summarize は再試行導線、tts はフォールバック動作の明示）
- [x] キャプチャストリーム切断・許可拒否時の案内
- [x] Supabase の insert / update / delete 失敗時の表示（無言で失敗しない）
- [x] allowlist 拒否・セッション切れ時の挙動確認
- [x] 監査で判明: TTS フォールバック時に失敗理由（429/セッション切れ）が握りつぶされる → player-bar に理由 notice を表示
- [x] 監査で判明: preset-list の削除エラーが ConfirmDialog の背面に隠れる → dialog に error を渡す
- [x] 監査で判明: selectGame がエラーを返さない → `{ error? }` 返却 + game-switcher に表示
- [x] 監査で判明: セクション保存失敗時に「保存中…」badge が永続 → 「保存失敗」表示に
- [x] 監査で判明: error.tsx / loading.tsx 不在（クエリ throw が英語の汎用エラー画面に）→ 追加
- [x] 監査で判明: allowlist から外した後も既存セッションが生き残る → (main)/layout で再チェック + /auth/denied で signOut
- [x] 監査で判明: Worker CORS が単一オリジン固定（本番化で localhost が壊れる）→ カンマ区切り複数対応 + Vary: Origin

### 磨き込み

- [x] あらすじの個別削除（履歴・生成直後カードに削除リンク + 共通 ConfirmDialog。`deleteSummary` Server Action）※ユーザー要望による仕様追加
- [x] 読み取り中・生成中・再生中の状態表示を DESIGN.md §6 の仕様通りに総点検（スピナー / シマー / player-bar アクティブ化 / badge-recording。route 遷移用の loading.tsx も追加）
- [x] focus-visible リング（2px primary）・ホバー（シアン）の全ボタン適用漏れチェック
- [x] 1024px 縦積みレイアウトの確認（DESIGN.md §8）。カード類の `sm:` ブレークポイントを `lg:` に統一
- [x] `motion-reduce:animate-none` を recording ドット・ゴールドシマーに適用
- [x] 未使用 export の整理（resolveSelectedGame / canvasToJpegBase64）
- [x] 不要コード・console.log の削除、`npm run lint` / `npm run build` クリーン（診断用の console.error は意図的に追加）

### デプロイ

- [x] Vercel へデプロイ（プロジェクト `kataribe`、本番 URL: `https://kataribe-nine.vercel.app`。環境変数4つ設定済み）
- [ ] Supabase の Auth リダイレクト URL 追加（ダッシュボードでの手動設定。Site URL + Redirect URLs）
- [x] Worker を本番デプロイ（secrets 設定済み、CORS を `localhost:3000 + kataribe-nine.vercel.app` に）
- [ ] 本番 URL でゲーム実機の通常フロー（キャプチャ → 読んで → 音声 → あらすじ)を一通り確認

### 動作確認

- [ ] レート上限に達すると 429 が返り、フロントに残数と案内が出る
- [ ] 主要エラーパスすべてで「無言の失敗」がない
- [ ] 本番環境で通常フロー（REQUIREMENTS.md §1.3)が完走する

## メモ

- レート制限のカウンタ保存先は Workers KV を第一候補に(なければ Durable Objects 等を検討し、採用理由を記録)
- ここで見つかった小さな改善は本チケットの Todo に追記して消化する
- **KV 採用理由**: JST 日次リセットに `rl:<email>:<endpoint>:<日付>` キー + TTL が素直に対応。read→write は非アトミックだが、単一ユーザーの暴走保険なので eventual consistency による僅かな超過は許容
- **意図的スキップ**: あらすじ compact カード展開トグルの本文シアンホバー（本文全体が青くなり過剰）/ アクティブなフィルタピルのホバー（クリックが no-op のため）
- **既知の制限（対応せず記録のみ）**: モーダルのフォーカストラップ・Escape クローズ / キーボードのみでの範囲選択 / nav の aria-current 表示 / signOut ボタンの pending 表示 / 1024px 未満のヘッダー詰まり（仕様外の幅）
