import { DEFAULT_COLOR } from "../config/teams.js";
import { baseEmbed } from "../lib/ui.js";

export async function handleHelp(interaction) {
  const embed = baseEmbed({
    title: "🧭 Help",
    color: DEFAULT_COLOR,
  }).setDescription(
    [
      "**Commands**",
      "• 🏁 `/next_race` — next race + countdown",
      "• 🏁 `/last_race` — top 3 + fastest lap",
      "• 🏆 `/standings type:Drivers season:2020` — standings with pages",
      "• 👤 `/driver name:<autocomplete> season:2020` — driver season stats",
      "• 🏎️ `/team name:<autocomplete> season:2020` — team stats + drivers",
      "• 📶 `/status` — uptime + API health",
      "",
      "**Tips**",
      "• Use autocomplete for driver/team names.",
      "• Use the buttons under standings to change pages.",
    ].join("\n")
  );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
