function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function formatCountdown(targetDate) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return "Race time";

  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes - days * 1440) / 60);

  return `${plural(days, "day")} ${plural(hours, "hour")}`;
}

export function discordTimestamp(date) {
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:F> (<t:${unix}:R>)`;
}
