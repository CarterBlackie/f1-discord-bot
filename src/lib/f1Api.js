import { seasonPrefix } from "./season.js";

const BASE = "https://api.jolpi.ca/ergast/f1";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getNextRace() {
  const data = await fetchJson(`${BASE}/current/next.json`);
  const race = data.MRData.RaceTable.Races[0];
  const when = new Date(
    race.time ? `${race.date}T${race.time}` : `${race.date}T00:00:00Z`
  );

  return {
    name: race.raceName,
    round: race.round,
    circuit: race.Circuit.circuitName,
    location: `${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`,
    when,
  };
}

export async function getDriverStandings(season) {
  const p = seasonPrefix(season);
  const data = await fetchJson(`${BASE}/${p}/driverStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

export async function getConstructorStandings(season) {
  const p = seasonPrefix(season);
  const data = await fetchJson(`${BASE}/${p}/constructorStandings.json`);
  return data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
}

export async function getDrivers(season) {
  const p = seasonPrefix(season);
  const data = await fetchJson(`${BASE}/${p}/drivers.json?limit=1000`);
  return data.MRData.DriverTable.Drivers;
}

export async function getDriverSeason(driverId, season) {
  const p = seasonPrefix(season);
  const data = await fetchJson(
    `${BASE}/${p}/drivers/${driverId}/driverStandings.json`
  );
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings[0];
}

// NEW: last race results with fastest lap
export async function getLastRaceResults() {
  const data = await fetchJson(`${BASE}/current/last/results.json?limit=1000`);
  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  const results = race.Results ?? [];

  return {
    season: race.season,
    round: race.round,
    raceName: race.raceName,
    date: race.date,
    circuit: race.Circuit?.circuitName ?? "",
    location: `${race.Circuit?.Location?.locality ?? ""}, ${race.Circuit?.Location?.country ?? ""}`
      .replace(/^, |, $/g, "")
      .trim(),
    results,
  };
}
