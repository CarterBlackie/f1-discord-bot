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

export async function getConstructors(season) {
  const p = seasonPrefix(season);
  const data = await fetchJson(`${BASE}/${p}/constructors.json?limit=100`);
  return data.MRData.ConstructorTable.Constructors;
}

export async function getTeamSeason(season, constructorId) {
  const p = seasonPrefix(season);

  const standings = await fetchJson(
    `${BASE}/${p}/constructorStandings.json`
  );

  const row =
    standings.MRData.StandingsTable.StandingsLists[0]
      ?.ConstructorStandings
      ?.find(c => c.Constructor.constructorId === constructorId);

  if (!row) return null;

  const driversData = await fetchJson(
    `${BASE}/${p}/constructors/${constructorId}/drivers.json`
  );

  return {
    position: row.position,
    points: row.points,
    wins: row.wins,
    name: row.Constructor.name,
    constructorId,
    drivers: driversData.MRData.DriverTable.Drivers,
  };
}

