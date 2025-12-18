import { baseEmbed } from "../lib/ui.js";
import { userError, tryAgainMessage } from "../lib/errors.js";
import { normalizeSeason, seasonLabel } from "../lib/season.js";
import { getDrivers, getDriverSeasonStanding } from "../lib/f1Api.js";
import { DEFAULT_COLOR, pickTeamColor } from "../config/teams.js";

function fullName(d) {
  return `${d?.givenName ?? ""} ${d?.familyName ?? ""}`.trim();
}

export async function handleDriverAutocomplete(interaction) {
  const season = normalizeSeason(interaction.options.getString("season") ?? "current");
  const query = String(interaction.options.getFocused() ?? "").toLowerCase().trim();

  try {
    const drivers = await getDrivers(season);

    const mapped = drivers.map((d) => ({
      id: d.driverId,
      label: fullName(d),
    }));

    const matches = mapped
      .filter((x) => x.label.toLowerCase().includes(query))
      .slice(0, 25)
      .map((x) => ({ name: x.label, value: x.id }));

    const fallback = mapped
      .slice(0, 25)
      .map((x) => ({ name: x.label, value: x.id }));

    await interaction.respond(query ? matches : fallback);
  } catch (e) {
    console.error(e);
    await interaction.respond([]);
  }
}

export async function handleDriver(interaction) {
  await interaction.deferReply();

  const season = normalizeSeason(interaction.options.getString("season") ?? "current");
  const driverId = interaction.options.getString("name", true);

  try {
    const row = await getDriverSeasonStanding(season, driverId);
    if (!row) return interaction.editReply(userError("No driver data found for that season."));

    const d = row.Driver;
    const team = row?.Constructors?.[0];
    const color = team?.constructorId ? pickTeamColor(team.constructorId) : DEFAULT_COLOR;

    const embed = baseEmbed({
      title: `👤 ${fullName(d)} (${seasonLabel(season)})`,
      color,
    }).addFields(
      { name: "Position", value: String(row.position ?? "—"), inline: true },
      { name: "Points", value: String(row.points ?? "—"), inline: true },
      { name: "Wins", value: String(row.wins ?? "—"), inline: true },
      { name: "Team", value: team?.name ?? "—", inline: true },
      { name: "Nationality", value: d?.nationality ?? "—", inline: true }
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    await interaction.editReply(`${userError("Couldn’t fetch driver data right now.")}\n${tryAgainMessage()}`);
  }
}
