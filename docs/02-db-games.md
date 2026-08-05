# 02 — DB・ゲーム管理

## 目的

REQUIREMENTS.md §5 の全テーブルを RLS 付きで作成し、ゲームの追加・切替・削除を実装する。以降の全チケットのデータ基盤。

- 参照: REQUIREMENTS.md §3.7・§5、DESIGN.md §5（header / support-row）・§6（設定）
- 依存: 01

## Todo

### DB

- [x] マイグレーション作成: `games` / `presets` / `sections` / `summaries`（REQUIREMENTS.md §5 のスキーマ通り。FK には `on delete cascade` を付け、ゲーム削除で配下も消えるようにする）
- [x] 全テーブルに RLS 有効化 + `user_id = auth.uid()` ポリシー（select / insert / update / delete）
- [x] `user_id` のデフォルトを `auth.uid()` に設定（クライアントから渡さない）
- [x] TypeScript 型を生成し `src/types/database.ts` 等に配置

### ゲーム管理 UI

- [x] ゲーム追加（タイトル自由入力のみ。text-input + button-primary「登録」）
- [x] ゲーム切替: ヘッダー中央に選択中ゲーム名のドロップダウン（heading-md）。全画面から常に選択中ゲームが分かる
- [x] 選択中ゲームの保持方法を実装（cookie + Server Action 方式を採用: サーバーから読めてリロードでも維持。localStorage 案は全ページのクライアント化を招くため不採用）
- [x] ゲーム削除: 確認ダイアログ必須（「配下のプリセット・セクション・あらすじも削除されます」を明示）。button-danger
- [x] 設定画面 `/settings`: ゲーム管理セクション（support-row 文法: 1px hairline-dark 下罫線の行リスト。右端 chevron は遷移先ができるチケット04で追加）

### 動作確認

- [ ] ゲームを追加 → ヘッダーのドロップダウンに出る → 切替できる → リロード後も選択が維持される
- [ ] ゲームを削除 → 確認ダイアログ → 配下データごと消える
- [x] Supabase ダッシュボードで RLS が全テーブル有効なこと、別ユーザーの行が見えないことを確認（MCP で確認済み: 4テーブル全て rls_enabled、16ポリシーすべて `(select auth.uid()) = user_id`、security advisor に RLS 系警告なし）

## メモ

- ゲーム未登録・未選択時のメイン画面は「まずゲームを登録してください」への誘導を出す
- `sections.seq` の採番ロジック（`max(seq) + 1`）はチケット05で実装
