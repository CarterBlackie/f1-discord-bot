import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env");
}

const commands = [
  new SlashCommandBuilder()
    .setName("next_race")
    .setDescription("Show the next F1 race (date/time + location).")
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
