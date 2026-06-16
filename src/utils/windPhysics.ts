const DIRECTION_DEGREES: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

/** Vento *de* uma direção → vegetação inclina para onde o vento *sopra*. */
export function windFromToLeanDegrees(compassPoint: string): number {
  const from = DIRECTION_DEGREES[compassPoint.toUpperCase()] ?? 0;
  return (from + 180) % 360;
}

export interface WindAnimationParams {
  amplitude: number;
  frequency: number;
  gustFrequency: number;
  gustIntensity: number;
  leanRadians: number;
  particleSpeed: number;
  label: string;
}

export function getWindIntensityLabel(speedMs: number): string {
  if (speedMs < 3) return 'Brisa marciana';
  if (speedMs < 6) return 'Vento moderado';
  if (speedMs < 10) return 'Rajadas intensas';
  return 'Tempestade de poeira';
}

export function windToAnimationParams(
  speedMs: number,
  compassPoint: string,
): WindAnimationParams {
  const normalized = Math.min(Math.max(speedMs / 14, 0.08), 1);
  const leanDeg = windFromToLeanDegrees(compassPoint);

  return {
    amplitude: 6 + normalized * 42,
    frequency: 0.6 + normalized * 2.8,
    gustFrequency: 1.4 + normalized * 3.2,
    gustIntensity: 0.25 + normalized * 0.75,
    leanRadians: (leanDeg * Math.PI) / 180,
    particleSpeed: 0.3 + normalized * 2.2,
    label: getWindIntensityLabel(speedMs),
  };
}
