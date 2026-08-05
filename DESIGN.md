# DESIGN.md — KATARIBE（カタリベ）

ベース: PlayStation Design System（getdesign.md / VoltAgent 版 DESIGN.md）を本アプリ用に翻案

---

## 0. このドキュメントについて

- REQUIREMENTS.md とセットで Claude Code に渡すデザイン仕様書
- 元ネタは PlayStation 公式サイトのデザイン分析（三面キャンバス構成・weight 300 のディスプレイ書体・シアンのホバー・ピルCTA）
- 元はコンソール販売サイト用の設計のため、**本アプリ（セカンドモニター常駐のダークツール）向けに引き当て直してある**。本ドキュメントが正であり、元のPlayStation DESIGN.mdより優先する

### デザインコンセプト

**「ゲーム機のシステムUI」**。マーケサイトではなく、PS5のホーム画面のような佇まいを目指す。
ゲームプレイ中にセカンドモニターに置きっぱなしにする画面なので:

- **ダークキャンバス一択**（眩しくない。ゲームの没入を妨げない）
- 装飾しない。写真もイラストも使わない。**色数を絞った黒×ブルーの静かな高級感**
- ボタンは大きく、離れた位置からでも押せる・読める
- 「あらすじ」だけがゴールドを纏う特別な場所（PS Plusバナーの文法を移植）

### ワードマーク

- 表記: **KATARIBE**（ローマ字大文字のみ。ロゴ画像は作らず、テキストワードマークで通す）
- 組み: Noto Sans JP / weight 300 / letter-spacing 0.35em / text `on-dark`
  （大きめの字間が「タイトルロゴ感」の本体。字間を詰めない）
- ログイン画面: display-lg（44px）でワードマーク、直下に caption-md / `mute-dark` で「カタリベ — あなただけの語り部」
- ヘッダー: heading-md 相当（18px / weight 300 / letter-spacing 0.35em）で「KATARIBE」。クリックでメイン画面へ
- ブラウザタイトル・faviconテキストも KATARIBE / K を使用（faviconは黒squircleに白の「K」weight 300、右下に `primary` のドット — LaboCoreの文法を踏襲）
- ワードマークに色・グラデ・イタリック・影を載せない。白一色

---

## 1. カラートークン

PlayStation システムの色をそのまま使用。ライトキャンバス系トークンは本アプリでは使わない。

```yaml
colors:
  # プライマリ（PlayStation Blue）
  primary: "#0070d1"          # 主要CTA・アクティブ状態・選択中インジケータ
  primary-pressed: "#0064b7"  # 押下時
  primary-active: "#004d8d"   # さらに深い押下・トグルON背景
  on-primary: "#ffffff"

  # ホバー（シアン）— このシステムの署名色。ホバー・フォーカス時のみ使用、静止状態では絶対に使わない
  hover-cyan: "#53b1ff"

  # キャンバス（ダーク3層）
  canvas: "#000000"            # ページ背景
  surface-elevated: "#121314"  # ヘッダー・パネル背景
  surface-card: "#181818"      # カード背景

  # テキスト
  on-dark: "#ffffff"                    # 見出し・主要テキスト
  body-dark: "rgba(255,255,255,0.7)"    # 本文
  mute-dark: "rgba(229,229,229,0.55)"   # メタ情報・キャプション
  hairline-dark: "rgba(229,229,229,0.2)" # 罫線・アウトラインボタン枠

  # 意味色
  warning: "#c81b3a"           # 削除・破壊的操作・エラー
  recording: "#c81b3a"         # キャプチャ中バッジ（warningと同色。点滅ドットで区別）

  # あらすじ専用ゴールド（PS Plusゴールドの移植。あらすじ以外に絶対使わない）
  gold-start: "#ffce21"
  gold-mid: "#f5a623"
  gold-end: "#ee8e00"
```

### 使わない色（元DESIGN.mdからの変更点）

- `commerce` 系オレンジ: 本アプリに購買アクションはないため**全面禁止**
- ライトキャンバス系（`canvas-light` / `surface-card(#f5f7fa)` 等）: ダーク一択のため不使用
- `marathon-yellow`: 不使用

---

## 2. タイポグラフィ

PlayStation SST は使えないため、日本語UIの代替として:

- **Noto Sans JP** — 全テキストロール（Google Fonts / next/font 経由）
- ディスプレイ階層は **weight 300（Light）** で組む。これがこのシステムの声。太字のゲーミングフォントに逃げない
- 数字・時刻など等幅が欲しい箇所のみ `font-variant-numeric: tabular-nums`

| トークン | サイズ | weight | line-height | 用途 |
|---|---|---|---|---|
| display-lg | 44px | 300 | 1.25 | ログイン画面のサービス名ロックアップ |
| display-md | 35px | 300 | 1.25 | 画面タイトル（あらすじ 等） |
| heading-xl | 28px | 300 | 1.25 | セクション見出し |
| heading-lg | 22px | 300 | 1.25 | カードタイトル・モーダル見出し |
| heading-md | 18px | 600 | 1.25 | カード内ラベル・強調 |
| body-md | 18px | 400 | 1.75 | **書き起こし本文・あらすじ本文**（読む対象なので行間だけ広げる: 元の1.5→1.75） |
| body-sm | 16px | 400 | 1.5 | 説明文・フォーム |
| caption-md | 14px | 400 | 1.5 | メタ情報（日時・セクション番号・プリセット名） |
| caption-sm | 12px | 500 | 1.5 | バッジ・最小ユーティリティ |
| button-lg | 18px | 700 | 1.25 | 主要CTAピル（letter-spacing 0.45px） |
| button-md | 14px | 700 | 1.25 | 小型ピル・チップ（letter-spacing 0.32px） |

- 和文にもディスプレイ階層は letter-spacing +0.02em 程度を足し、weight 300 の「静かな威厳」を保つ
- 書き起こし・あらすじ本文の最大行長は全角35文字程度（max-width ~640px）

---

## 3. 形状・スペーシング・エレベーション

元システムをそのまま踏襲。

```yaml
rounded:
  sm: 4px      # テキスト入力
  md: 8px      # カード全般・サムネイル
  lg: 16px     # モーダル・ダイアログ
  full: 9999px # すべてのCTAピル・チップ・バッジ

spacing: # 8pxベース
  xxs: 4px / xs: 8px / sm: 12px / md: 16px / lg: 24px / xl: 32px / xxl: 48px
  section: 64px  # 画面内の大ブロック間（元の96pxはアプリには広すぎるため64pxに縮小）
```

- **影は使わない**。静止状態のカードに drop-shadow 禁止。深さは3層のサーフェス色差（#000 / #121314 / #181818）だけで作る
- 唯一許されるグラデーション: ①あらすじカード上辺のゴールドバー ②画面最上部の `#121314 → #000000` の縦フェード（シネマティックな暗転。任意）
- 罫線は 1px `hairline-dark` のみ

---

## 4. 署名インタラクション（シアン・ホバー）

元システムの「cyan hover-scale」をアプリ向けにスケール調整して全ボタンに適用する。

- **primary ピルの hover**: 背景 `primary → hover-cyan`、`transform: scale(1.04)`、transition 150ms ease-out
  （元は1.2倍だが、UIボタンでは大げさなので1.04倍）
- **アウトラインボタンの hover**: 枠と文字が `hover-cyan` に変わる。背景は変えない
- **カードの hover**: 背景 `#181818 → #1f2024`、scale なし
- **focus-visible**: 2px solid `primary` のリング（キーボード操作用）
- 押下時は `primary-pressed`、影 `0 4px 12px rgba(0,0,0,0.16)`（押した時だけ浮く）
- シアンは**ホバー/フォーカス以外で画面に存在してはならない**

---

## 5. コンポーネント

### ボタン

| 名前 | 仕様 | 用途 |
|---|---|---|
| button-primary | bg `primary` / text white / button-lg / rounded-full / **height 56px** / padding 16px 32px | プリセット「読んで」ボタン、あらすじ生成、キャプチャ開始 |
| button-secondary | bg transparent / 1px `hairline-dark` / text `on-dark` / rounded-full / height 48px | 今回だけ範囲指定、キャンセル、二次操作 |
| button-danger | bg transparent / 1px+text `warning` / rounded-full | 削除（hover で bg `warning`・text white に反転） |
| button-disabled | bg `#1f2024` / text `mute-dark` / rounded-full | 無効状態（キャプチャ未開始時のプリセットボタン等） |
| icon-button | bg `rgba(255,255,255,0.16)` / rounded-full / 48×48px | 再生/一時停止/停止、カルーセルパドル相当 |

- 主要ボタンの高さは元の48pxより大きい**56px**。セカンドモニターを斜めから見て押す前提のため
- ボタンラベルは動詞で短く:「読んで」「もう一度」「まとめる」「登録」

### バッジ・チップ

| 名前 | 仕様 | 用途 |
|---|---|---|
| badge-info | bg `primary` / text white / caption-sm / rounded-full / padding 4px 10px | セクション番号（#12）、プリセット名タグ |
| badge-recording | bg `surface-card` / 1px `hairline-dark` / rounded-full。左に8pxの `recording` 色ドット（2秒周期でopacity点滅） | 「キャプチャ中」表示 |
| filter-pill / -active | 元システム準拠をダーク反転: default bg `rgba(255,255,255,0.08)` / active bg `on-dark`・text `canvas` | セクション一覧の並び順切替、あらすじ範囲選択 |

### カード

| 名前 | 仕様 | 用途 |
|---|---|---|
| section-card | bg `surface-card` / rounded-md / padding 24px。左に切り抜き画像サムネ（16:9, rounded-md）、右に badge-info（連番）+ caption-md（日時・プリセット名）+ body-md 本文（3行でclamp） | セクション一覧の1行 |
| summary-card | bg `surface-elevated` / rounded-md / padding 48px 32px / **上辺に4pxのゴールドバー**（`gold-start → gold-end` 横グラデ）/ タイトルは heading-xl weight300 | あらすじ。PS Plusバナーの文法。**ゴールドはここ以外使用禁止** |
| preview-panel | bg `surface-elevated` / rounded-md / 内部にライブプレビュー(video)を16:9で表示。キャプチャ停止中は中央に button-primary「キャプチャ開始」だけを置く | メイン画面の心臓部 |
| player-bar | bg `surface-elevated` / rounded-full / height 64px / icon-button 3つ + 現在の読み上げ対象名 caption-md | 音声再生コントロール。画面下部に固定 |

### 入力

- text-input: bg `#0d0d0e` / 1px `hairline-dark` / rounded-sm / height 48px / focus時 2px `primary` 枠
- 範囲選択オーバーレイ（プリセット登録・今回だけ範囲指定）: 静止画の上に半透明黒 `rgba(0,0,0,0.5)` を敷き、ドラッグ矩形の内側だけ素通し。矩形枠は 2px `hover-cyan`、四隅に8pxのハンドル。確定ボタンは矩形直下に button-primary

### ナビゲーション

- header: bg `canvas` / height 56px / rounded-none。左にサービスロゴ（weight 300のワードマーク）、中央に選択中ゲーム名のドロップダウン（heading-md）、右にナビリンク（メイン / セクション / あらすじ / 設定、body-sm）とアバター32px円
- ナビは最小限・周縁に。主役は常にプレビューと本文（元システムの「chromeは静かに」の哲学）

---

## 6. 画面別適用

### ログイン
- 全面 `canvas` 黒。中央にサービス名を display-lg weight300 で1行、その下に一言タグライン（mute-dark / body-sm）、button-primary「Googleでログイン」のみ
- ゲーム機の起動画面のような、要素3つだけの静かな画面にする

### メイン（キャプチャ画面）
- 上段: preview-panel（幅の~60%）+ 右側にプリセットボタン縦積み（button-primary、56px、幅いっぱい）
- プリセットボタンの下に button-secondary「今回だけ範囲指定」「範囲を登録」
- 下段: 直近の読み取り結果（section-card 1枚、本文はclampせず全文）+ player-bar
- キャプチャ中は preview-panel 右上に badge-recording
- **読み取り実行中のフィードバック**: 押したプリセットボタンがラベル「読み取り中…」+ ピル内左端にスピナー。テキスト化完了で即本文表示（テキスト先出し）、TTS再生開始で player-bar がアクティブ化

### セクション一覧
- 画面タイトル display-md「セクション」+ filter-pill（新しい順 / 古い順）
- section-card を1カラム縦積み（gap 16px）。ホバーで `#1f2024`
- カード内アクション: icon-button（再生）+ テキストリンク「編集」「削除」（削除はwarning色）

### あらすじ
- 生成フォーム: 範囲選択（filter-pillで「全部」or セクション範囲入力）+ button-primary「まとめる」
- 生成結果は summary-card。本文 body-md / 行間1.75 / max-width 640px。直下に player-bar
- 履歴は summary-card の縮小版（ゴールドバーは維持、padding 24px、本文3行clamp）を縦積み
- 生成中はゴールドバーが左右にゆっくり流れるシマー（このアプリで唯一の「演出」。本命機能の特別感）

### 設定
- ゲーム管理・プリセット管理を support-row 文法のダーク版で: 1px `hairline-dark` 下罫線の行リスト、右端にchevron。装飾なし

---

## 7. Do / Don't

### Do
- PlayStation Blue はCTAと選択中状態だけに。1画面に青の面積は最小限（青が貴重だから効く）
- ディスプレイ階層は必ず weight 300。見出しを太らせたくなったらサイズを上げて weight を下げる
- 深さはサーフェス3層の色差で作る。迷ったら影ではなく背景色を1段上げる
- CTAは全部ピル（rounded-full）、カードは全部 8px。この2語彙以外の角丸を増やさない
- ホバーは必ずシアン。新しいホバー表現を発明しない

### Don't
- 静止状態のカードに影・グラデ・枠線装飾をつけない
- ゴールドをあらすじ以外に使わない（バッジ・ボタン・見出しに流用禁止）
- オレンジ系・ライトキャンバスを持ち込まない
- ゲーミングUIの定番（ネオン枠、斜めカット、グロー、RGBアニメ）に逃げない。かっこよさは黒とweight 300で出す
- 絵文字・イラスト・写真素材を使わない

## 8. レスポンシブ

- 対象はPCブラウザのみ（REQUIREMENTS.md準拠）。1280px基準で設計し、1024pxまではメイン画面の上段を縦積み（プレビューが上、プリセットボタンが下）に崩す
- それ未満の幅・モバイルは考慮しない