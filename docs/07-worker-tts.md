# 07 — Worker: tts + 音声再生

## 目的

テキストを音声化して再生する。テキスト化直後の自動再生・再生コントロール・フォールバックまで含め、「読んで → 数秒後に音声が流れる」体験を完成させる。

- 参照: REQUIREMENTS.md §3.5・§6、DESIGN.md §5（player-bar / icon-button）
- 依存: 05

## Todo

### POST /tts（Worker）

- [x] Gemini TTS の **最新モデル ID を必ず確認**（2026-08 時点の最新 `gemini-3.1-flash-tts-preview` を Interactions API 経由で使用。定数化済み）
- [x] 朗読向けの落ち着いた日本語ボイスを候補から選定（`Sulafat`(Warm) を採用。代替候補をコードコメントに記載。朗読スタイル指示文も固定付与）
- [x] テキスト → Gemini TTS → PCM を **WAV に変換して返す**（24kHz/16bit/mono の RIFF ヘッダ付与、Content-Type: audio/wav）
- [x] 長文対応: Gemini TTS の入力上限を確認し、必要ならテキスト分割 → 順次生成（上限は 32k トークンと確認 → 想定文字数では分割不要。16,000字の安全ガードのみ実装）

### フロント: 再生

- [x] Worker から受け取った WAV を `Audio` / `AudioContext` で再生
- [x] player-bar（bg surface-elevated / rounded-full / height 64px / 画面下部固定）: 再生・一時停止・停止の icon-button 3つ + 現在の読み上げ対象名（caption-md）
- [x] セクションのテキスト化直後に **自動再生**（チケット05のフローに接続。テキスト表示 → TTS 生成 → 再生開始で player-bar アクティブ化）
- [x] 長文の途中でも一時停止・停止できる
- [x] **フォールバック**: Gemini TTS 失敗時は Web Speech API（`speechSynthesis`、ja-JP ボイス）で読み上げ。player-bar の操作系は共通化する（PlayerContext がエンジン差を吸収）
- [x] 音声は保存しない（都度生成。Object URL は再生終了時に解放）

### 動作確認

- [x] 「読んで」→ テキスト表示 → 音声再生開始まで体感で待てる長さ
- [x] 一時停止 / 再開 / 停止が効く
- [x] Worker を意図的に落とす（URL を無効化する等）→ Web Speech API で読み上げられる

（追記）棒読み対策としてスタイル指示を「プロの朗読家・感情と抑揚豊かに・漢字は文脈に合った読み方」に強化済み。固有名詞の誤読（例: 魔神→まかみ）は TTS の既知の限界のため、チケット08 のテキスト修正で対処する運用

## メモ

- 再生状態はグローバル（Context）で管理し、チケット08（再読み上げ）・09（あらすじ読み上げ）から同じ player-bar を使い回す
- 再生対象の切替時は前の再生を停止してから開始する
