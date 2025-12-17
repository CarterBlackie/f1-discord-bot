// src/index.js
import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// Jolpica provides an Ergast-compatible API base.
const F1_BASE = "https://api.jolpi.ca/ergast/f1";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function discordTimestamp(date) {
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:F> (<t:${unix}:R>)`;
}

function padRight(s, n) {
  const str = String(s ?? "");
  return str.length >= n ? str : str + " ".repeat(n - str.length);
}

function normalizeSeason(season) {
  if (!season) return "current";
  const s = String(season).trim().toLowerCase();
  if (s === "current") return "current";
  if (/^\d{4}$/.test(s)) return s;
  return "current";
}

function seasonToPathPrefix(season) {
  return season === "current" ? "current" : season;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`F1 API error: ${res.status}`);
  return res.json();
}

async function fetchNextRace() {
  const url = `${F1_BASE}/current/next.json`;
  const data = await fetchJson(url);

  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  const iso = race.time ? `${race.date}T${race.time}` : `${race.date}T00:00:00Z`;
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

async function fetchDriverStandings(seasonRaw) {
  const season = normalizeSeason(seasonRaw);
  const prefix = seasonToPathPrefix(season);
  const url =
    season === "current"
      ? `${F1_BASE}/current/driverStandings.json`
      : `${F1_BASE}/${prefix}/driverStandings.json`;

  const data = await fetchJson(url);
  const list =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];

  const seasonOut =
    season === "current"
      ? data?.MRData?.StandingsTable?.season ?? "Current"
      : season;

  return { season: seasonOut, list };
}

async function fetchConstructorStandings(seasonRaw) {
  const season = normalizeSeason(seasonRaw);
  const prefix = seasonToPathPrefix(season);
  const url =
    season === "current"
      ? `${F1_BASE}/current/constructorStandings.json`
      : `${F1_BASE}/${prefix}/constructorStandings.json`;

  const data = await fetchJson(url);
  const list =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ??
    [];

  const seasonOut =
    season === "current"
      ? data?.MRData?.StandingsTable?.season ?? "Current"
      : season;

  return { season: seasonOut, list };
}

function formatDriverStandings(season, list) {
  const top = list.slice(0, 20);

  const lines = top.map((row) => {
    const pos = padRight(row.position, 2);
    const points = padRight(row.points, 3);

    const given = row?.Driver?.givenName ?? "";
    const family = row?.Driver?.familyName ?? "";
    const name = `${given} ${family}`.trim();

    const team = row?.Constructors?.[0]?.name ?? "";
    return `${pos}. ${padRight(points, 3)} pts  ${name}${team ? ` — ${team}` : ""}`;
  });

  return (
    `🏆 **F1 Driver Standings (${season})**\n` +
    "```" +
    "\n" +
    lines.join("\n") +
    "\n" +
    "```"
  );
}

function formatConstructorStandings(season, list) {
  const top = list.slice(0, 20);

  const lines = top.map((row) => {
    const pos = padRight(row.position, 2);
    const points = padRight(row.points, 3);
    const name = row?.Constructor?.name ?? "Unknown";
    return `${pos}. ${padRight(points, 3)} pts  ${name}`;
  });

  return (
    `🏆 **F1 Constructor Standings (${season})**\n` +
    "```" +
    "\n" +
    lines.join("\n") +
    "\n" +
    "```"
  );
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
      if (!race) return interaction.editReply("I couldn’t find the next race.");

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

  if (interaction.commandName === "standings") {
    await interaction.deferReply();

    const type = interaction.options.getString("type", true);
    const season = normalizeSeason(interaction.options.getString("season") ?? "current");

    try {
      if (type === "drivers") {
        const { season: s, list } = await fetchDriverStandings(season);
        if (!list.length) return interaction.editReply("No driver standings found.");
        return interaction.editReply(formatDriverStandings(s, list));
      }

      if (type === "constructors") {
        const { season: s, list } = await fetchConstructorStandings(season);
        if (!list.length) return interaction.editReply("No constructor standings found.");
        return interaction.editReply(formatConstructorStandings(s, list));
      }

      return interaction.editReply("Unknown standings type.");
    } catch (e) {
      console.error(e);
      return interaction.editReply("Something broke while fetching standings.");
    }
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("Missing DISCORD_TOKEN in .env");
}

client.login(token);
