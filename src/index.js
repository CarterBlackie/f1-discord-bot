import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

import { handleNextRace } from "./commands/nextRace.js";
import { handleStandings } from "./commands/standings.js";
import { handleDriver, handleDriverAutocomplete } from "./commands/driver.js";
import { handleLastRace } from "./commands/lastRace.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === "driver") {
      return handleDriverAutocomplete(interaction);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "next_race") {
    return handleNextRace(interaction);
  }

  if (interaction.commandName === "last_race") {
    return handleLastRace(interaction);
  }

  if (interaction.commandName === "standings") {
    return handleStandings(interaction);
  }

  if (interaction.commandName === "driver") {
    return handleDriver(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
