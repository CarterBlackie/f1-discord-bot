import { DEFAULT_COLOR, pickTeamColor } from "../config/teams.js";
import { baseEmbed } from "../lib/ui.js";
import { userError, tryAgainMessage } from "../lib/errors.js";
import { getLastRaceResults } from "../lib/f1Api.js";

function nameOfDriver(d) {
  return `${d?.givenName ?? ""} ${d?.familyName ?? ""}`.trim();
}

export async function handleLastRace(interaction) {
  await interaction.deferReply();

  try {
    const data = await getLastRaceResults();
    if (!data) return interaction.editReply(userError("Couldn’t find the last race."));

    const sorted = [...data.results].sort((a, b) => Number(a.position) - Number(b.position));
    const top3 = sorted.slice(0, 3);

    const podium = top3.map((r) => {
      const medal = r.position === "1" ? "🥇" : r.position === "2" ? "🥈" : "🥉";
      const driver = nameOfDriver(r.Driver);
      const team = r?.Constructor?.name ?? "";
      return `${medal} **${driver}**${team ? ` (${team})` : ""}`;
    });

    // Find fastest lap
    let fastest = null;
    for (const r of data.results) {
      const fl = r?.FastestLap;
      if (!fl?.Time?.time) continue;
      if (fl.rank === "1" || fl.rank === 1) {
        fastest = r;
        break;
      }
      if (!fastest) fastest = r;
    }

    const fastestText = (() => {
      if (!fastest?.FastestLap?.Time?.time) return "Not available";
      const who = nameOfDriver(fastest.Driver);
      const t = fastest.FastestLap.Time.time;
      const lap = fastest.FastestLap.lap ? `Lap ${fastest.FastestLap.lap}` : "—";
      const team = fastest?.Constructor?.name ?? "";
      return `⚡ **${who}**${team ? ` (${team})` : ""} — **${t}** (${lap})`;
    })();

    const color =
      top3?.[0]?.Constructor?.constructorId
        ? pickTeamColor(top3[0].Constructor.constructorId)
        : DEFAULT_COLOR;

    const embed = baseEmbed({
      title: `🏁 Last Race: ${data.name}`,
      color,
    })
      .setDescription(
        `${data.circuit}${data.location ? ` — ${data.location}` : ""}\nSeason ${data.season}, Round ${data.round}, Date ${data.date}`
      )
      .addFields(
        { name: "Podium", value: podium.join("\n") || "—", inline: false },
        { name: "Fastest Lap", value: fastestText, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    await interaction.editReply(`${userError("Couldn’t fetch last race data right now.")}\n${tryAgainMessage()}`);
  }
}
