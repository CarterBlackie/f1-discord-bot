import { DEFAULT_COLOR } from "../config/teams.js";
import { baseEmbed } from "../lib/ui.js";
import { pingApi } from "../lib/f1Api.js";

const startedAt = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s - h * 3600) / 60);
  const sec = s - h * 3600 - m * 60;
  return `${h}h ${m}m ${sec}s`;
}

export async function handleStatus(interaction) {
  await interaction.deferReply({ ephemeral: true });

  let apiOk = false;
  try {
    apiOk = await pingApi();
  } catch {
    apiOk = false;
  }

  const embed = baseEmbed({
    title: "📶 Status",
    color: DEFAULT_COLOR,
  }).addFields(
    { name: "Uptime", value: formatUptime(Date.now() - startedAt), inline: true },
    { name: "API", value: apiOk ? "✅ OK" : "❌ Down", inline: true }
  );

  await interaction.editReply({ embeds: [embed] });
}
