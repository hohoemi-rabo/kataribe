const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeZone: "Asia/Tokyo",
});

// timeZone を固定してサーバー/クライアント間のハイドレーション差異を防ぐ
export function formatDateJa(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}
