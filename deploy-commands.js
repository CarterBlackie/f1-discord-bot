import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
}

const seasonChoices = [
  { name: "Current", value: "current" },
  { name: "2025", value: "2025" },
  { name: "2024", value: "2024" },
  { name: "2023", value: "2023" },
  { name: "2022", value: "2022" },
  { name: "2021", value: "2021" },
  { name: "2020", value: "2020" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("next_race")
    .setDescription("Show the next F1 race.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("last_race")
    .setDescription("Show the last F1 race (top 3 + fastest lap).")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("standings")
    .setDescription("Show F1 standings.")
    .addStringOption(opt =>
      opt.setName("type")
        .setDescription("Drivers or constructors")
        .setRequired(true)
        .addChoices(
          { name: "Drivers", value: "drivers" },
          { name: "Constructors", value: "constructors" }
        )
    )
    .addStringOption(opt =>
      opt.setName("season")
        .setDescription("Season")
        .addChoices(...seasonChoices)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("driver")
    .setDescription("Show a driver's season stats.")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Driver (autocomplete)")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName("season")
        .setDescription("Season")
        .addChoices(...seasonChoices)
    )
    .toJSON(),

  // ✅ NEW
  new SlashCommandBuilder()
    .setName("team")
    .setDescription("Show a constructor's season stats.")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Team name")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName("season")
        .setDescription("Season")
        .addChoices(...seasonChoices)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

await rest.put(
  Routes.applicationGuildCommands(clientId, guildId),
  { body: commands }
);

console.log("Commands deployed.");
