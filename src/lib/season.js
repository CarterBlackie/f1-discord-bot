export function normalizeSeason(input) {
  if (!input) return "current";
  const s = String(input).trim().toLowerCase();
  if (s === "current") return "current";
  if (/^\d{4}$/.test(s)) return s;
  return "current";
}

export function seasonPrefix(season) {
  return season === "current" ? "current" : season;
}

export function seasonLabel(season) {
  return season === "current" ? "Current" : season;
}
