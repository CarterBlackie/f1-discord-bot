import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// Jolpica provides an Ergast-compatible API base.
// We'll use: /current/next.json
const F1_BASE = "https://api.jolpi.ca/ergast/f1";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function discordTimestamp(date) {
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:F> (<t:${unix}:R>)`;
}

async function fetchNextRace() {
  const url = `${F1_BASE}/current/next.json`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`F1 API error: ${res.status}`);
  }

  const data = await res.json();
  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  // Ergast-style fields are UTC date + time (time may be missing)
  const iso = race.time
    ? `${race.date}T${race.time}`
    : `${race.date}T00:00:00Z`;

  const when = new Date(iso);

  return {
    raceName: race.raceName,
    round: race.round,
    circuit: race.Circuit?.circuitName ?? "Unknown circuit",
    locality: race.Circuit?.Location?.locality ?? "",
    country: race.Circuit?.Location?.country ?? "",
    when,
  };
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "next_race") {
    await interaction.deferReply();

    try {
      const race = await fetchNextRace();
      if (!race) {
        return interaction.editReply("I couldn’t find the next race.");
      }

      const where = [race.circuit, race.locality, race.country]
        .filter(Boolean)
        .join(" — ");

      const msg =
        `🏁 **Next F1 Race**\n` +
        `**${race.raceName}** (Round ${race.round})\n` +
        `${where}\n` +
        `Start: ${discordTimestamp(race.when)}`;

      return interaction.editReply(msg);
    } catch (e) {
      console.error(e);
      return interaction.editReply("Something broke while fetching F1 data.");
    }
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("Missing DISCORD_TOKEN in .env");
}

client.login(token);
