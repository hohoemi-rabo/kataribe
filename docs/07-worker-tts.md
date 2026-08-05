# 07 — Worker: tts + 音声再生

## 目的

テキストを音声化して再生する。テキスト化直後の自動再生・再生コントロール・フォールバックまで含め、「読んで → 数秒後に音声が流れる」体験を完成させる。

- 参照: REQUIREMENTS.md §3.5・§6、DESIGN.md §5（player-bar / icon-button）
- 依存: 05

## Todo

### POST /tts（Worker）

- [ ] Gemini TTS の **最新モデル ID を必ず確認**（preview 系のため変動しやすい。実装時点の推奨を調査して定数化）
- [ ] 朗読向けの落ち着いた日本語ボイスを候補から選定（MVP は固定でよい）
- [ ] テキスト → Gemini TTS → PCM を **WAV に変換して返す**（Content-Type: audio/wav）
- [ ] 長文対応: Gemini TTS の入力上限を確認し、必要ならテキスト分割 → 順次生成

### フロント: 再生

- [ ] Worker から受け取った WAV を `Audio` / `AudioContext` で再生
- [ ] player-bar（bg surface-elevated / rounded-full / height 64px / 画面下部固定）: 再生・一時停止・停止の icon-button 3つ + 現在の読み上げ対象名（caption-md）
- [ ] セクションのテキスト化直後に **自動再生**（チケット05のフローに接続。テキスト表示 → TTS 生成 → 再生開始で player-bar アクティブ化）
- [ ] 長文の途中でも一時停止・停止できる
- [ ] **フォールバック**: Gemini TTS 失敗時は Web Speech API（`speechSynthesis`、ja-JP ボイス）で読み上げ。player-bar の操作系は共通化する
- [ ] 音声は保存しない（都度生成）

### 動作確認

- [ ] 「読んで」→ テキスト表示 → 音声再生開始まで体感で待てる長さ
- [ ] 一時停止 / 再開 / 停止が効く
- [ ] Worker を意図的に落とす（URL を無効化する等）→ Web Speech API で読み上げられる

## メモ

- 再生状態はグローバル（Context）で管理し、チケット08（再読み上げ）・09（あらすじ読み上げ）から同じ player-bar を使い回す
- 再生対象の切替時は前の再生を停止してから開始する
