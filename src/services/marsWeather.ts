import type { InsightWeatherResponse, WeatherSnapshot } from '@/types/nasa';
import { nasaApi } from './api';

function parseSolData(sol: string, data: InsightWeatherResponse): WeatherSnapshot | null {
  const solData = data[sol];
  if (!solData || typeof solData === 'string' || Array.isArray(solData)) return null;

  return {
    sol: Number(sol),
    tempMax: solData.AT.mx,
    tempMin: solData.AT.mn,
    tempAvg: solData.AT.av,
    pressure: solData.PRE.av,
    windSpeed: solData.HWS.av,
    windDirection: solData.WD.most_common.compass_point,
    season: solData.Season,
  };
}

export async function fetchLatestWeather(): Promise<WeatherSnapshot | null> {
  const { data } = await nasaApi.get<InsightWeatherResponse>('/insight_weather/', {
    params: { feedtype: 'json', ver: '1.0' },
  });

  const latestSol = data.sol_keys[data.sol_keys.length - 1];
  return parseSolData(latestSol, data);
}

export async function fetchWeatherHistory(count = 7): Promise<WeatherSnapshot[]> {
  const { data } = await nasaApi.get<InsightWeatherResponse>('/insight_weather/', {
    params: { feedtype: 'json', ver: '1.0' },
  });

  const sols = data.sol_keys.slice(-count);
  return sols
    .map((sol) => parseSolData(sol, data))
    .filter((s): s is WeatherSnapshot => s !== null);
}
