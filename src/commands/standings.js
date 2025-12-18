import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

import { baseEmbed } from "../lib/ui.js";
import { userError, tryAgainMessage } from "../lib/errors.js";
import { normalizeSeason, seasonLabel } from "../lib/season.js";
import { getConstructorStandings, getDriverStandings } from "../lib/f1Api.js";
import { DEFAULT_COLOR, pickTeamColor } from "../config/teams.js";

const PAGE_SIZE = 10;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function standingsKey(type, season, page) {
  return `std|${type}|${season}|${page}`;
}

function buildButtons(type, season, page, maxPage) {
  const prev = new ButtonBuilder()
    .setCustomId(standingsKey(type, season, page - 1))
    .setLabel("Prev")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 0);

  const next = new ButtonBuilder()
    .setCustomId(standingsKey(type, season, page + 1))
    .setLabel("Next")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= maxPage);

  const pageBtn = new ButtonBuilder()
    .setCustomId("std|noop")
    .setLabel(`Page ${page + 1}/${maxPage + 1}`)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  return new ActionRowBuilder().addComponents(prev, pageBtn, next);
}

function formatDriverLine(r) {
  const pos = String(r.position).padStart(2, " ");
  const pts = String(r.points).padStart(3, " ");
  const family = r?.Driver?.familyName ?? "";
  const team = r?.Constructors?.[0]?.name ?? "";
  return `${pos}. ${pts}  ${family}${team ? ` (${team})` : ""}`;
}

function formatConstructorLine(r) {
  const pos = String(r.position).padStart(2, " ");
  const pts = String(r.points).padStart(3, " ");
  const team = r?.Constructor?.name ?? "Unknown";
  return `${pos}. ${pts}  ${team}`;
}

async function loadStandings(type, season) {
  return type === "drivers"
    ? getDriverStandings(season)
    : getConstructorStandings(season);
}

function pickStandingsColor(type, list) {
  if (!list?.length) return DEFAULT_COLOR;

  if (type === "drivers") {
    const id = list?.[0]?.Constructors?.[0]?.constructorId;
    return id ? pickTeamColor(id) : DEFAULT_COLOR;
  }

  const id = list?.[0]?.Constructor?.constructorId;
  return id ? pickTeamColor(id) : DEFAULT_COLOR;
}

function renderStandings({ type, season, page, list }) {
  const maxPage = Math.max(0, Math.ceil(list.length / PAGE_SIZE) - 1);
  const safePage = clamp(page, 0, maxPage);

  const start = safePage * PAGE_SIZE;
  const chunk = list.slice(start, start + PAGE_SIZE);

  const lines =
    type === "drivers"
      ? chunk.map(formatDriverLine)
      : chunk.map(formatConstructorLine);

  const title =
    type === "drivers"
      ? `🏆 Driver Standings (${seasonLabel(season)})`
      : `🏆 Constructor Standings (${seasonLabel(season)})`;

  const color = pickStandingsColor(type, list);

  const embed = baseEmbed({ title, color }).setDescription(
    "```" + (lines.join("\n") || "No data") + "```"
  );

  const row = buildButtons(type, season, safePage, maxPage);

  return { embed, row, safePage, maxPage };
}

export async function handleStandings(interaction) {
  await interaction.deferReply();

  const type = interaction.options.getString("type", true);
  const season = normalizeSeason(interaction.options.getString("season") ?? "current");

  try {
    const list = await loadStandings(type, season);
    if (!list.length) {
      return interaction.editReply(userError("No standings found for that season."));
    }

    const { embed, row } = renderStandings({ type, season, page: 0, list });
    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (e) {
    console.error(e);
    await interaction.editReply(`${userError("Couldn’t fetch standings right now.")}\n${tryAgainMessage()}`);
  }
}

export async function handleStandingsButton(interaction) {
  // customId: std|<type>|<season>|<page>
  const parts = interaction.customId.split("|");
  if (parts.length < 4) return;

  const type = parts[1];
  const season = parts[2];
  const page = Number(parts[3]);

  // Ignore noop
  if (type === "noop") return;

  try {
    const list = await loadStandings(type, season);
    if (!list.length) {
      return interaction.update({
        content: userError("No standings found for that season."),
        embeds: [],
        components: [],
      });
    }

    const { embed, row } = renderStandings({ type, season, page, list });

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  } catch (e) {
    console.error(e);
    await interaction.update({
      content: `${userError("Couldn’t update standings right now.")}\n${tryAgainMessage()}`,
      embeds: [],
      components: [],
    });
  }
}
