import { seasonPrefix } from "./season.js";

const BASE = "https://api.jolpi.ca/ergast/f1";

// Simple in-memory cache
const cache = new Map(); // key -> { ts, data }
const CACHE_MS = 5 * 60 * 1000;

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_MS) return null;
  return hit.data;
}

function setCached(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function pingApi() {
  // lightweight endpoint
  const url = `${BASE}/current.json?limit=1`;
  const res = await fetch(url);
  return res.ok;
}

export async function getNextRace() {
  const key = "nextRace";
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/current/next.json`);
  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  const when = new Date(race.time ? `${race.date}T${race.time}` : `${race.date}T00:00:00Z`);

  const out = {
    season: race.season,
    round: race.round,
    name: race.raceName,
    circuit: race.Circuit?.circuitName ?? "",
    location: `${race.Circuit?.Location?.locality ?? ""}, ${race.Circuit?.Location?.country ?? ""}`
      .replace(/^, |, $/g, "")
      .trim(),
    when,
  };

  setCached(key, out);
  return out;
}

export async function getLastRaceResults() {
  const key = "lastRace";
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/current/last/results.json?limit=1000`);
  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race) return null;

  const out = {
    season: race.season,
    round: race.round,
    name: race.raceName,
    date: race.date,
    circuit: race.Circuit?.circuitName ?? "",
    location: `${race.Circuit?.Location?.locality ?? ""}, ${race.Circuit?.Location?.country ?? ""}`
      .replace(/^, |, $/g, "")
      .trim(),
    results: race.Results ?? [],
  };

  setCached(key, out);
  return out;
}

export async function getDriverStandings(season) {
  const p = seasonPrefix(season);
  const key = `drvStand|${p}`;
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/${p}/driverStandings.json`);
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  setCached(key, list);
  return list;
}

export async function getConstructorStandings(season) {
  const p = seasonPrefix(season);
  const key = `conStand|${p}`;
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/${p}/constructorStandings.json`);
  const list = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
  setCached(key, list);
  return list;
}

export async function getDrivers(season) {
  const p = seasonPrefix(season);
  const key = `drivers|${p}`;
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/${p}/drivers.json?limit=1000`);
  const list = data?.MRData?.DriverTable?.Drivers ?? [];
  setCached(key, list);
  return list;
}

export async function getDriverSeasonStanding(season, driverId) {
  const p = seasonPrefix(season);

  // Try direct
  try {
    const data = await fetchJson(`${BASE}/${p}/drivers/${driverId}/driverStandings.json`);
    const row = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings?.[0];
    if (row) return row;
  } catch {
    // fallback below
  }

  // Fallback: scan standings
  const list = await getDriverStandings(season);
  return list.find((r) => r?.Driver?.driverId === driverId) ?? null;
}

export async function getConstructors(season) {
  const p = seasonPrefix(season);
  const key = `constructors|${p}`;
  const cached = getCached(key);
  if (cached) return cached;

  const data = await fetchJson(`${BASE}/${p}/constructors.json?limit=200`);
  const list = data?.MRData?.ConstructorTable?.Constructors ?? [];
  setCached(key, list);
  return list;
}

export async function getTeamSeason(season, constructorId) {
  const p = seasonPrefix(season);

  const standings = await getConstructorStandings(season);
  const row = standings.find((c) => c?.Constructor?.constructorId === constructorId);
  if (!row) return null;

  const driversData = await fetchJson(`${BASE}/${p}/constructors/${constructorId}/drivers.json?limit=1000`);
  const drivers = driversData?.MRData?.DriverTable?.Drivers ?? [];

  return {
    constructorId,
    name: row?.Constructor?.name ?? "Unknown",
    position: row?.position ?? "—",
    points: row?.points ?? "—",
    wins: row?.wins ?? "—",
    drivers,
  };
}
