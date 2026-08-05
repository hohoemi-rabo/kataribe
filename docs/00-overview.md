# チケット一覧 — KATARIBE

REQUIREMENTS.md §8 の実装チケットを個別ファイルに分割したもの。
**番号順に、1チケットずつ承認を挟んで** 進める。進捗は各ファイル内の Todo（`- [ ]` → `- [x]`）で管理する。

| # | ファイル | チケット | 状態 |
|---|---|---|---|
| 01 | [01-foundation.md](./01-foundation.md) | プロジェクト基盤（Supabase + OAuth + allowlist + デザイン基盤） | 完了 |
| 02 | [02-db-games.md](./02-db-games.md) | DB・ゲーム管理 | 完了 |
| 03 | [03-capture.md](./03-capture.md) | 画面キャプチャ | 完了 |
| 04 | [04-presets.md](./04-presets.md) | 範囲プリセット | 完了 |
| 05 | [05-worker-transcribe.md](./05-worker-transcribe.md) | Worker: transcribe + セクション保存 | 完了 |
| 06 | [06-manual-region.md](./06-manual-region.md) | 「今回だけ範囲指定」 | 完了 |
| 07 | [07-worker-tts.md](./07-worker-tts.md) | Worker: tts + 音声再生 | 進行中 |
| 08 | [08-sections.md](./08-sections.md) | セクション一覧 | 未着手 |
| 09 | [09-worker-summarize.md](./09-worker-summarize.md) | Worker: summarize + あらすじ画面 | 未着手 |
| 10 | [10-polish.md](./10-polish.md) | 仕上げ（レート制限・エラーハンドリング） | 未着手 |

- 状態は「未着手 / 進行中 / 完了」。チケットの着手・完了時にこの表も更新する
- チケット03・04・06 は `getDisplayMedia` を含むため **ブラウザ実機での動作確認が必須**（自動テスト不可）
