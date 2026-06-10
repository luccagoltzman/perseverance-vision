const MS_PER_DAY = 86_400_000;
const MARS_SOL_SECONDS = 88_775;
const EARTH_DAY_SECONDS = 86_400;

export interface RoverLanding {
  landingDate: string;
  landingSol?: number;
}

const ROVER_LANDINGS: Record<string, RoverLanding> = {
  curiosity: { landingDate: '2012-08-06', landingSol: 0 },
  perseverance: { landingDate: '2021-02-18', landingSol: 0 },
  opportunity: { landingDate: '2004-01-25', landingSol: 0 },
  spirit: { landingDate: '2004-01-04', landingSol: 0 },
};

export function earthDateToSol(earthDate: string, roverName: string): number {
  const landing = ROVER_LANDINGS[roverName];
  if (!landing) return 0;

  const target = new Date(`${earthDate}T12:00:00Z`).getTime();
  const landingMs = new Date(`${landing.landingDate}T12:00:00Z`).getTime();
  const earthDays = (target - landingMs) / MS_PER_DAY;
  const solRatio = EARTH_DAY_SECONDS / MARS_SOL_SECONDS;

  return Math.max(0, Math.floor(earthDays * solRatio));
}

export function solToEarthDate(sol: number, roverName: string): string {
  const landing = ROVER_LANDINGS[roverName];
  if (!landing) return new Date().toISOString().split('T')[0];

  const solRatio = MARS_SOL_SECONDS / EARTH_DAY_SECONDS;
  const earthDays = sol * solRatio;
  const landingMs = new Date(`${landing.landingDate}T12:00:00Z`).getTime();
  const result = new Date(landingMs + earthDays * MS_PER_DAY);

  return result.toISOString().split('T')[0];
}

export function getCurrentSol(roverName: string): number {
  const today = new Date().toISOString().split('T')[0];
  return earthDateToSol(today, roverName);
}

export function formatSol(sol: number): string {
  return `Sol ${sol.toLocaleString('pt-BR')}`;
}

export function getRoverLanding(roverName: string): RoverLanding | undefined {
  return ROVER_LANDINGS[roverName];
}
