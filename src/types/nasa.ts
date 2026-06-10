export type RoverName = 'curiosity' | 'perseverance' | 'opportunity' | 'spirit';

export interface RoverCamera {
  id: number;
  name: string;
  full_name: string;
}

export interface MarsPhoto {
  id: number;
  sol: number;
  camera: RoverCamera;
  img_src: string;
  earth_date: string;
  rover: {
    name: string;
    status: string;
    landing_date: string;
    launch_date: string;
  };
}

export interface MarsPhotosResponse {
  photos: MarsPhoto[];
}

export interface InsightWeatherSol {
  AT: { av: number; mn: number; mx: number; ct: number };
  HWS: { av: number; mn: number; mx: number; ct: number };
  PRE: { av: number; mn: number; mx: number; ct: number };
  WD: { most_common: { compass_degrees: number; compass_point: string } };
  First_UTC: string;
  Last_UTC: string;
  Season: string;
}

export interface InsightWeatherResponse {
  sol_keys: string[];
  validity_checks: Record<string, boolean>;
  [sol: string]: InsightWeatherSol | string[] | Record<string, boolean>;
}

export interface WeatherSnapshot {
  sol: number;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  season: string;
}

export interface RoverManifest {
  name: RoverName;
  label: string;
  landingDate: string;
  landingSol: number;
  status: 'active' | 'completed';
  cameras: { id: string; name: string; fullName: string }[];
}
