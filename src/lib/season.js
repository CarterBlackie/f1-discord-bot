export function normalizeSeason(input) {
  if (!input) return "current";
  if (input === "current") return "current";
  if (/^\d{4}$/.test(input)) return input;
  return "current";
}

export function seasonPrefix(season) {
  return season === "current" ? "current" : season;
}
