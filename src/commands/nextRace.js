import { EmbedBuilder } from "discord.js";
import { getNextRace } from "../lib/f1Api.js";
import { formatCountdown, discordTimestamp } from "../lib/time.js";
import { DEFAULT_COLOR } from "../config/teams.js";

export async function handleNextRace(interaction) {
  await interaction.deferReply();

  const race = await getNextRace();
  const countdown = formatCountdown(race.when);

  const embed = new EmbedBuilder()
    .setTitle("Next F1 Race")
    .setColor(DEFAULT_COLOR)
    .addFields(
      { name: "Race", value: `${race.name} (Round ${race.round})` },
      { name: "Location", value: race.location },
      { name: "Start", value: discordTimestamp(race.when) },
      { name: "Countdown", value: `**${countdown}**` }
    );

  await interaction.editReply({ embeds: [embed] });
}
