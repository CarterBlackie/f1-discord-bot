import { EmbedBuilder } from "discord.js";
import { normalizeSeason } from "../lib/season.js";
import { getDrivers, getDriverSeason } from "../lib/f1Api.js";
import { pickTeamColor } from "../config/teams.js";

export async function handleDriverAutocomplete(interaction) {
  const season = normalizeSeason(interaction.options.getString("season"));
  const query = interaction.options.getFocused().toLowerCase();

  const drivers = await getDrivers(season);

  const matches = drivers
    .filter((d) =>
      `${d.givenName} ${d.familyName}`.toLowerCase().includes(query)
    )
    .slice(0, 25)
    .map((d) => ({
      name: `${d.givenName} ${d.familyName}`,
      value: d.driverId,
    }));

  await interaction.respond(matches);
}

export async function handleDriver(interaction) {
  await interaction.deferReply();

  const season = normalizeSeason(interaction.options.getString("season"));
  const driverId = interaction.options.getString("name", true);

  const row = await getDriverSeason(driverId, season);
  if (!row) return interaction.editReply("No data found.");

  const team = row.Constructors[0];

  const embed = new EmbedBuilder()
    .setTitle(`${row.Driver.givenName} ${row.Driver.familyName}`)
    .setColor(pickTeamColor(team.constructorId))
    .addFields(
      { name: "Season", value: season, inline: true },
      { name: "Position", value: row.position, inline: true },
      { name: "Points", value: row.points, inline: true },
      { name: "Wins", value: row.wins, inline: true },
      { name: "Team", value: team.name, inline: true }
    );

  await interaction.editReply({ embeds: [embed] });
}
