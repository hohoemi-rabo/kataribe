import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // プライマリ（PlayStation Blue）
        primary: "#0070d1",
        "primary-pressed": "#0064b7",
        "primary-active": "#004d8d",
        "on-primary": "#ffffff",
        // ホバー・フォーカス時のみ使用。静止状態では出さない
        "hover-cyan": "#53b1ff",
        // キャンバス（ダーク3層）。深さは影ではなくこの色差で作る
        canvas: "#000000",
        "surface-elevated": "#121314",
        "surface-card": "#181818",
        "surface-hover": "#1f2024",
        // テキスト
        "on-dark": "#ffffff",
        "body-dark": "rgba(255,255,255,0.7)",
        "mute-dark": "rgba(229,229,229,0.55)",
        "hairline-dark": "rgba(229,229,229,0.2)",
        // 意味色
        warning: "#c81b3a",
        recording: "#c81b3a",
        // あらすじ（summary-card）専用。他への流用禁止
        "gold-start": "#ffce21",
        "gold-mid": "#f5a623",
        "gold-end": "#ee8e00",
      },
      fontFamily: {
        sans: [
          "var(--font-noto-sans-jp)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-lg": [
          "44px",
          { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "300" },
        ],
        "display-md": [
          "35px",
          { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "300" },
        ],
        "heading-xl": [
          "28px",
          { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "300" },
        ],
        "heading-lg": [
          "22px",
          { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "300" },
        ],
        "heading-md": ["18px", { lineHeight: "1.25", fontWeight: "600" }],
        // 書き起こし・あらすじ本文は読む対象なので行間 1.75
        "body-md": ["18px", { lineHeight: "1.75", fontWeight: "400" }],
        "body-sm": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption-sm": ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        "button-lg": [
          "18px",
          { lineHeight: "1.25", letterSpacing: "0.45px", fontWeight: "700" },
        ],
        "button-md": [
          "14px",
          { lineHeight: "1.25", letterSpacing: "0.32px", fontWeight: "700" },
        ],
      },
      letterSpacing: {
        wordmark: "0.35em",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "64px",
      },
    },
  },
  plugins: [],
} satisfies Config;
