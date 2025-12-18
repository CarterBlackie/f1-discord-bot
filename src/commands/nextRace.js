import { DEFAULT_COLOR } from "../config/teams.js";
import { baseEmbed } from "../lib/ui.js";
import { userError, tryAgainMessage } from "../lib/errors.js";
import { getNextRace } from "../lib/f1Api.js";
import { formatCountdown, discordTimestamp } from "../lib/time.js";

export async function handleNextRace(interaction) {
  await interaction.deferReply();

  try {
    const race = await getNextRace();
    if (!race) {
      return interaction.editReply(userError("Couldn’t find the next race."));
    }

    const embed = baseEmbed({
      title: "🏁 Next F1 Race",
      color: DEFAULT_COLOR,
    }).addFields(
      { name: "Race", value: `**${race.name}** (Round ${race.round})`, inline: false },
      { name: "Location", value: race.location || "—", inline: false },
      { name: "Start", value: discordTimestamp(race.when), inline: false },
      { name: "Countdown", value: `**${formatCountdown(race.when)}**`, inline: false }
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    await interaction.editReply(`${userError("Couldn’t fetch race data right now.")}\n${tryAgainMessage()}`);
  }
}
