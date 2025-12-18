import { baseEmbed } from "../lib/ui.js";
import { userError, tryAgainMessage } from "../lib/errors.js";
import { normalizeSeason, seasonLabel } from "../lib/season.js";
import { getConstructors, getTeamSeason } from "../lib/f1Api.js";
import { DEFAULT_COLOR, pickTeamColor } from "../config/teams.js";

export async function handleTeamAutocomplete(interaction) {
  const season = normalizeSeason(interaction.options.getString("season") ?? "current");
  const query = String(interaction.options.getFocused() ?? "").toLowerCase().trim();

  try {
    const teams = await getConstructors(season);

    const matches = teams
      .filter((t) => String(t.name ?? "").toLowerCase().includes(query))
      .slice(0, 25)
      .map((t) => ({ name: t.name, value: t.constructorId }));

    const fallback = teams
      .slice(0, 25)
      .map((t) => ({ name: t.name, value: t.constructorId }));

    await interaction.respond(query ? matches : fallback);
  } catch (e) {
    console.error(e);
    await interaction.respond([]);
  }
}

export async function handleTeam(interaction) {
  await interaction.deferReply();

  const season = normalizeSeason(interaction.options.getString("season") ?? "current");
  const constructorId = interaction.options.getString("name", true);

  try {
    const team = await getTeamSeason(season, constructorId);
    if (!team) return interaction.editReply(userError("No team data found for that season."));

    const driverNames =
      team.drivers?.length
        ? team.drivers.map((d) => `${d.givenName} ${d.familyName}`).join(", ")
        : "—";

    const embed = baseEmbed({
      title: `🏎️ ${team.name} (${seasonLabel(season)})`,
      color: constructorId ? pickTeamColor(constructorId) : DEFAULT_COLOR,
    }).addFields(
      { name: "Position", value: String(team.position ?? "—"), inline: true },
      { name: "Points", value: String(team.points ?? "—"), inline: true },
      { name: "Wins", value: String(team.wins ?? "—"), inline: true },
      { name: "Drivers", value: driverNames, inline: false }
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    await interaction.editReply(`${userError("Couldn’t fetch team data right now.")}\n${tryAgainMessage()}`);
  }
}
