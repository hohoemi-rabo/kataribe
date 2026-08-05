const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeZone: "Asia/Tokyo",
});

// timeZone を固定してサーバー/クライアント間のハイドレーション差異を防ぐ
export function formatDateJa(isoString: string): string {
  return dateFormatter.format(new Date(isoString));
}

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Tokyo",
});

export function formatDateTimeJa(isoString: string): string {
  return dateTimeFormatter.format(new Date(isoString));
}
