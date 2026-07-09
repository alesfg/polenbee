import { useEffect, useState } from 'react';

export interface WeatherData {
  temp: number;
  condition: string;
  wind: string;
  forageIndex: string;
  humidity: number;
  forecast: { day: string; temp: number }[];
}

const FALLBACK: WeatherData = {
  temp: 34,
  condition: 'Soleado',
  wind: '8 km/h',
  forageIndex: 'Alto',
  humidity: 45,
  forecast: [
    { day: 'Jue', temp: 31 },
    { day: 'Vie', temp: 33 },
    { day: 'Sáb', temp: 36 },
    { day: 'Dom', temp: 32 },
  ],
};

function wmoToCondition(code: number): string {
  if (code === 0) return 'Despejado';
  if (code <= 3) return 'Parcialmente nublado';
  if (code <= 48) return 'Niebla';
  if (code <= 67) return 'Lluvia';
  if (code <= 77) return 'Nieve';
  if (code <= 82) return 'Chubascos';
  return 'Tormenta';
}

function forageIndex(temp: number, windspeed: number, weathercode: number): string {
  if (temp >= 20 && windspeed <= 20 && weathercode < 45) return 'Alto';
  if (temp >= 15 && windspeed <= 30) return 'Medio';
  return 'Bajo';
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function useWeather(lat = 39.4767, lon = -6.3724) {
  const [weather, setWeather] = useState<WeatherData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,windspeed_10m,weathercode&daily=temperature_2m_max&forecast_days=4&timezone=Europe%2FMadrid`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled) return;
        const cur = json.current;
        const daily = json.daily;
        const temp = Math.round(cur.temperature_2m);
        const windspeed = cur.windspeed_10m;
        const wcode = cur.weathercode;
        const forecast = (daily.time as string[]).map((t: string, i: number) => ({
          day: DAY_NAMES[new Date(t).getDay()],
          temp: Math.round(daily.temperature_2m_max[i]),
        }));
        setWeather({
          temp,
          condition: wmoToCondition(wcode),
          wind: `${Math.round(windspeed)} km/h`,
          forageIndex: forageIndex(temp, windspeed, wcode),
          humidity: 45,
          forecast,
        });
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lat, lon]);

  return { weather, loading };
}
