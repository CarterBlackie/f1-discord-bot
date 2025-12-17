import { EmbedBuilder } from "discord.js";
import { getLastRaceResults } from "../lib/f1Api.js";
import { DEFAULT_COLOR, pickTeamColor } from "../config/teams.js";

function driverName(d) {
  return `${d?.givenName ?? ""} ${d?.familyName ?? ""}`.trim();
}

export async function handleLastRace(interaction) {
  await interaction.deferReply();

  try {
    const data = await getLastRaceResults();
    if (!data) return interaction.editReply("I couldn’t find the last race.");

    const top3 = data.results
      .slice()
      .sort((a, b) => Number(a.position) - Number(b.position))
      .slice(0, 3);

    const top3Lines = top3.map((r) => {
      const name = driverName(r.Driver);
      const team = r.Constructor?.name ?? "";
      const timeOrStatus = r.Time?.time ?? r.status ?? "—";
      return `**${r.position}.** ${name}${team ? ` — ${team}` : ""} (${timeOrStatus})`;
    });

    // Find fastest lap from results (may not exist in some older data)
    let fastest = null;
    for (const r of data.results) {
      const fl = r?.FastestLap;
      if (!fl?.Time?.time) continue;

      // Ergast/Jolpica includes rank (1 = fastest). Use it if present.
      if (fl.rank === "1" || fl.rank === 1) {
        fastest = r;
        break;
      }

      // fallback: first one we see
      if (!fastest) fastest = r;
    }

    const fastestField = (() => {
      if (!fastest?.FastestLap?.Time?.time) {
        return { name: "Fastest Lap", value: "Not available", inline: false };
      }
      const fl = fastest.FastestLap;
      const who = driverName(fastest.Driver);
      const time = fl.Time.time;
      const lap = fl.lap ? `Lap ${fl.lap}` : "";
      return {
        name: "Fastest Lap",
        value: `**${who}** — **${time}**${lap ? ` (${lap})` : ""}`,
        inline: false,
      };
    })();

    const color =
      top3?.[0]?.Constructor?.constructorId
        ? pickTeamColor(top3[0].Constructor.constructorId)
        : DEFAULT_COLOR;

    const embed = new EmbedBuilder()
      .setTitle(`Last Race: ${data.raceName}`)
      .setColor(color)
      .setDescription(
        `${data.circuit}${data.location ? ` — ${data.location}` : ""}\n` +
          `Season ${data.season}, Round ${data.round}, Date ${data.date}`
      )
      .addFields(
        { name: "Top 3", value: top3Lines.join("\n") || "—", inline: false },
        fastestField
      );

    return interaction.editReply({ embeds: [embed] });
  } catch (e) {
    console.error(e);
    return interaction.editReply("Something broke while fetching the last race.");
  }
}
