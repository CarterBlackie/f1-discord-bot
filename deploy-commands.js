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
  { name: "2024", value: "2024" },
  { name: "2023", value: "2023" },
  { name: "2022", value: "2022" },
  { name: "2021", value: "2021" },
  { name: "2020", value: "2020" }
];

const commands = [
  new SlashCommandBuilder()
    .setName("next_race")
    .setDescription("Show the next F1 race (date/time + location).")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("standings")
    .setDescription("Show F1 standings by season.")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Drivers or constructors")
        .setRequired(true)
        .addChoices(
          { name: "Drivers", value: "drivers" },
          { name: "Constructors", value: "constructors" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("season")
        .setDescription("Season year")
        .setRequired(false)
        .addChoices(...seasonChoices)
    )
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

try {
  console.log("Registering slash commands (guild)...");
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });
  console.log("Done.");
} catch (err) {
  console.error(err);
  process.exit(1);
}
