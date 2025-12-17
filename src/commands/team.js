import { EmbedBuilder } from "discord.js";
import { normalizeSeason } from "../lib/season.js";
import { getConstructors, getTeamSeason } from "../lib/f1Api.js";
import { pickTeamColor } from "../config/teams.js";

export async function handleTeamAutocomplete(interaction) {
  const season = normalizeSeason(interaction.options.getString("season"));
  const query = interaction.options.getFocused().toLowerCase();

  const teams = await getConstructors(season);

  const matches = teams
    .filter(t => t.name.toLowerCase().includes(query))
    .slice(0, 25)
    .map(t => ({ name: t.name, value: t.constructorId }));

  await interaction.respond(matches);
}

export async function handleTeam(interaction) {
  await interaction.deferReply();

  const season = normalizeSeason(interaction.options.getString("season"));
  const constructorId = interaction.options.getString("name", true);

  const team = await getTeamSeason(season, constructorId);
  if (!team) {
    return interaction.editReply("Team not found for that season.");
  }

  const driverNames =
    team.drivers.length > 0
      ? team.drivers.map(d => `${d.givenName} ${d.familyName}`).join(", ")
      : "—";

  const embed = new EmbedBuilder()
    .setTitle(team.name)
    .setColor(pickTeamColor(team.constructorId))
    .addFields(
      { name: "Season", value: season, inline: true },
      { name: "Position", value: team.position, inline: true },
      { name: "Points", value: team.points, inline: true },
      { name: "Wins", value: team.wins, inline: true },
      { name: "Drivers", value: driverNames }
    );

  await interaction.editReply({ embeds: [embed] });
}
