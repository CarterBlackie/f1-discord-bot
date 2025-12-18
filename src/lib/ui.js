import { EmbedBuilder } from "discord.js";
import { EMBED_FOOTER } from "../config/teams.js";

export function baseEmbed({ title, color }) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setFooter({ text: EMBED_FOOTER });
}
