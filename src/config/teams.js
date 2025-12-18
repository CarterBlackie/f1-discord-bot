export const TEAM_COLORS = {
  red_bull: 0x1e41ff,
  ferrari: 0xdc0000,
  mercedes: 0x00d2be,
  mclaren: 0xff8700,
  aston_martin: 0x006f62,
  alpine: 0xff87bc,
  williams: 0x005aff,
  rb: 0x2b4562,
  alpha_tauri: 0x2b4562,
  sauber: 0x00e701,
  alfa: 0x900000,
  haas: 0xffffff,
  renault: 0xffcc00,
  racing_point: 0xf596c8,
  force_india: 0xff5f00,
};

export const DEFAULT_COLOR = 0xff5aa5;
export const EMBED_FOOTER = "F1 Stats Bot • Data via Jolpica (Ergast-compatible)";

export function pickTeamColor(constructorId) {
  return TEAM_COLORS[constructorId] ?? DEFAULT_COLOR;
}
