import { EmbedBuilder } from "discord.js";
import { normalizeSeason } from "../lib/season.js";
import { getDriverStandings, getConstructorStandings } from "../lib/f1Api.js";
import { pickTeamColor } from "../config/teams.js";

export async function handleStandings(interaction) {
  await interaction.deferReply();

  const type = interaction.options.getString("type", true);
  const season = normalizeSeason(interaction.options.getString("season"));

  const list =
    type === "drivers"
      ? await getDriverStandings(season)
      : await getConstructorStandings(season);

  const lines = list.slice(0, 20).map((r) => {
    const name =
      type === "drivers"
        ? `${r.Driver.givenName} ${r.Driver.familyName}`
        : r.Constructor.name;
    return `${r.position}. ${r.points} pts — ${name}`;
  });

  const color =
    type === "drivers"
      ? pickTeamColor(list[0].Constructors[0].constructorId)
      : pickTeamColor(list[0].Constructor.constructorId);

  const embed = new EmbedBuilder()
    .setTitle(`F1 ${type === "drivers" ? "Driver" : "Constructor"} Standings (${season})`)
    .setColor(color)
    .setDescription("```" + lines.join("\n") + "```");

  await interaction.editReply({ embeds: [embed] });
}
