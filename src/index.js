import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

import { handleHelp } from "./commands/help.js";
import { handleStatus } from "./commands/status.js";
import { handleNextRace } from "./commands/nextRace.js";
import { handleLastRace } from "./commands/lastRace.js";
import {
  handleStandings,
  handleStandingsButton,
} from "./commands/standings.js";
import { handleDriver, handleDriverAutocomplete } from "./commands/driver.js";
import { handleTeam, handleTeamAutocomplete } from "./commands/team.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  // Button interactions (pagination)
  if (interaction.isButton()) {
    if (interaction.customId.startsWith("std|")) {
      return handleStandingsButton(interaction);
    }
    return;
  }

  // Autocomplete interactions
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "driver") {
      return handleDriverAutocomplete(interaction);
    }
    if (interaction.commandName === "team") {
      return handleTeamAutocomplete(interaction);
    }
    return;
  }

  // Slash commands
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "help") return handleHelp(interaction);
  if (interaction.commandName === "status") return handleStatus(interaction);
  if (interaction.commandName === "next_race") return handleNextRace(interaction);
  if (interaction.commandName === "last_race") return handleLastRace(interaction);
  if (interaction.commandName === "standings") return handleStandings(interaction);
  if (interaction.commandName === "driver") return handleDriver(interaction);
  if (interaction.commandName === "team") return handleTeam(interaction);
});

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Missing DISCORD_TOKEN in .env");

client.login(token);
