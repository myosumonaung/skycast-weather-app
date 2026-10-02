
"use client";

import { useEffect, useState } from "react";
  
const cities = [
  { name: "東京", latitude: 35.68, longitude: 139.77 },
  { name: "大阪", latitude: 34.69, longitude: 135.50 },
  { name: "札幌", latitude: 43.06, longitude: 141.35 },
  { name: "那覇", latitude: 26.21, longitude: 127.68 },
  { name: "横浜", latitude: 35.44, longitude: 139.64 },
  { name: "名古屋", latitude: 35.18, longitude: 136.91 },
  { name: "京都", latitude: 35.01, longitude: 135.77 },
  { name: "神戸", latitude: 34.69, longitude: 135.20 },
  { name: "福岡", latitude: 33.59, longitude: 130.40 },
  { name: "熊本", latitude: 32.80, longitude: 130.71 },
  { name: "広島", latitude: 34.39, longitude: 132.46 },
  { name: "仙台", latitude: 38.27, longitude: 140.87 },
  { name: "新潟", latitude: 37.92, longitude: 139.04 },
  { name: "金沢", latitude: 36.56, longitude: 136.66 },
  { name: "長野", latitude: 36.65, longitude: 138.19 },
  { name: "静岡", latitude: 34.98, longitude: 138.38 },
  { name: "鹿児島", latitude: 31.60, longitude: 130.56 },
  { name: "長崎", latitude: 32.75, longitude: 129.88 },
  { name: "山形", latitude: 38.24, longitude: 140.36 },
  { name: "米沢", latitude: 37.92, longitude: 140.12 },
];


type WeatherData = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number; 
  };
daily: {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  uv_index_max: number[];
};
    
hourly: {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  precipitation_probability: number[];
};

  
};



function getWeatherInfo(code: number) {
  if (code === 0)
    return { label: "晴れ", icon: "/icons/sunny.png" };

  if (code <= 2)
    return {
      label: "晴れ時々くもり",
      icon: "/icons/partly-cloudy.png",
    };

  if (code === 3)
    return { label: "くもり", icon: "/icons/cloudy.png" };

  if (code === 45 || code === 48)
    return { label: "霧", icon: "/icons/fog.png" };

  if (code >= 51 && code <= 57)
    return { label: "霧雨", icon: "/icons/rain.png" };

  if (code >= 61 && code <= 67)
    return { label: "雨", icon: "/icons/rain.png" };

  if (code >= 71 && code <= 77)
    return { label: "雪", icon: "/icons/snow.png" };

  if (code >= 80 && code <= 82)
    return { label: "にわか雨", icon: "/icons/rain.png" };

  if (code === 85 || code === 86)
    return { label: "にわか雪", icon: "/icons/snow.png" };

  if (code >= 95 && code <= 99)
    return {
      label: "雷雨",
      icon: "/icons/thunderstorm.png",
    };

  return { label: "不明", icon: "/icons/cloudy.png" };
}



function formatDate(dateString: string) {
  const date = new Date(dateString);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}


function getNext24Hours(weather: WeatherData) {
  const currentTime = new Date(
    weather.hourly.time[0]
  );

  const now = new Date();

  const currentHour = now.getHours();

  const today = weather.hourly.time[0].split("T")[0];

  const index = weather.hourly.time.findIndex(
    (time) =>
      time === `${today}T${String(currentHour).padStart(2, "0")}:00`
  );

  const startIndex = index >= 0 ? index : 0;

  return weather.hourly.time
    .slice(startIndex, startIndex + 24)
    .map((time, offset) => {
      const i = startIndex + offset;

      return {
        time,
        temperature: weather.hourly.temperature_2m[i],
        weatherCode: weather.hourly.weather_code[i],
        rain: weather.hourly.precipitation_probability[i],
      };
    });
}


function getWeatherBackground(
  code: number,
  isDay: boolean
) {
  if (!isDay) {
    return "from-indigo-950 to-slate-800";
  }

  if (code === 0 || code <= 2) {
    return "from-amber-400 to-orange-400";
  }

  if (code === 3) {
    return "from-slate-400 to-blue-400";
  }

  if (code >= 51 && code <= 67) {
    return "from-blue-500 to-indigo-500";
  }

  if (code >= 71 && code <= 86) {
    return "from-sky-300 to-blue-400";
  }

  if (code >= 95) {
    return "from-slate-700 to-indigo-900";
  }

  return "from-blue-400 to-violet-400";
}



export default function Home() {
  const [city, setCity] = useState(cities[0]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setLoading(true);
      setError("");
      setWeather(null);

      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${city.latitude}` +
          `&longitude=${city.longitude}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
          `&hourly=temperature_2m,weather_code,precipitation_probability` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max` +
          `&forecast_days=7` +
          `&timezone=Asia%2FTokyo`;
      

        const res = await fetch(url, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("天気データの取得に失敗しました。");
        }

        const data: WeatherData = await res.json();
        if (!controller.signal.aborted) {
          setWeather(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "予期しないエラーが発生しました。"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadWeather();

    return () => controller.abort();
  }, [city]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-blue-500">
            WEATHER DASHBOARD
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            SkyCast ☁️
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            あなたの街の天気を、もっと身近に。
          </p>
        </div>
        
        <input
          type="text"
  placeholder="🔍 都市を検索..."
  value={search}
  onChange={(e) => {
    const value = e.target.value;
    setSearch(value);

    const selected = cities.find(
      (c) => c.name === value.trim()
    );

    if (selected) {
      setCity(selected);
    }
  }}
  className="glass-card rounded-2xl px-5 py-3 outline-none"
        />


        <select
          aria-label="都市を選択"
          className="glass-card rounded-2xl px-5 py-3 font-medium outline-none"
          value={city.name}
          onChange={(e) => {
            const selected = cities.find(
              (c) => c.name === e.target.value
            );

            if (selected) setCity(selected);
          }}
        >
                    
        {cities
          .filter((c) => c.name.includes(search.trim()))
          .map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}

        </select>
      </header>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center">
          <div className="mb-4 animate-pulse text-4xl">☁️</div>
          <p>天気データを読み込み中...</p>
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-3xl bg-red-50 p-6 text-red-600 shadow-sm"
        >
          エラー：{error}
        </div>
      ) : weather ? (
        <>
          {/* Current Weather */}
          <section
            className={`rounded-3xl bg-gradient-to-br p-7 text-white
              shadow-xl transition-all duration-700 sm:p-10
              ${getWeatherBackground(
                weather.current.weather_code,
                weather.current.is_day === 1
          )}`}
>
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  CURRENT WEATHER
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  {city.name}の天気
                </h2>

                <p className="mt-7 text-6xl font-bold tracking-tight sm:text-7xl">
                  {Math.round(weather.current.temperature_2m)}°
                </p>

                <p className="mt-4 text-xl font-medium">
                  {getWeatherInfo(weather.current.weather_code).label}
                </p>

                <p className="mt-3 text-sm text-white/85">
                  風速 {weather.current.wind_speed_10m} km/h
                </p>
              </div>

              <img
                alt={getWeatherInfo(weather.current.weather_code).label}
                src={getWeatherInfo(weather.current.weather_code).icon}
                className="weather-icon h-36 w-36 self-center object-contain sm:h-48 sm:w-48"
              />
            </div>
          </section>
          
          {/* Weather Details */}
          <section className="mt-8">
            <h2 className="mb-5 text-xl font-bold sm:text-2xl">
              天気の詳細
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        💧 湿度
      </p>
      <p className="mt-3 text-2xl font-bold">
        {weather.current.relative_humidity_2m}%
      </p>
    </div>

    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        🌡️ 体感温度
      </p>
      <p className="mt-3 text-2xl font-bold">
        {Math.round(
          weather.current.apparent_temperature
        )}°C
      </p>
    </div>

    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        💨 風速
      </p>
      <p className="mt-3 text-2xl font-bold">
        {weather.current.wind_speed_10m}
        <span className="ml-1 text-sm">
          km/h
        </span>
      </p>
    </div>

    <div className="glass-card rounded-2xl p-5">
      <p className="text-sm text-slate-500">
        ☀️ UV指数（今日の最大）
      </p>
      <p className="mt-3 text-2xl font-bold">
        {weather.daily.uv_index_max[0]}
      </p>
    </div>

            </div>
          </section>

          {/* 24-Hour Forecast */}
          <section className="mt-8">
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-xl font-bold sm:text-2xl">
      24時間の天気予報
    </h2>

    <span className="text-xs text-slate-500">
      NEXT 24 HOURS
    </span>
  </div>

  <div className="flex gap-3 overflow-x-auto pb-4">
    {getNext24Hours(weather).map((hour) => {
      const info = getWeatherInfo(hour.weatherCode);

      return (
        <div
          key={hour.time}
          className="glass-card flex min-w-24 flex-col items-center rounded-2xl p-4 text-center"
        >
          <p className="text-sm font-medium">
            {hour.time.split("T")[1].slice(0, 5)}
          </p>

          <img
            src={info.icon}
            alt={info.label}
            className="my-4 h-14 w-14 object-contain"
          />

          <p className="text-lg font-bold">
            {Math.round(hour.temperature)}°
          </p>

          <p className="mt-2 text-xs text-blue-500">
            ☔ {hour.rain}%
          </p>
        </div>
      );
    })}
  </div>
          </section>


          {/* Seven-Day Forecast */}
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold sm:text-2xl">
                7日間の天気予報
              </h2>

              <span className="text-xs text-slate-500">
                NEXT 7 DAYS
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {weather.daily.time.map(
                (date: string, i: number) => {
                  const info = getWeatherInfo(
                    weather.daily.weather_code[i]
                  );

                  return (
                    <div
                      key={date}
                      className="glass-card rounded-2xl p-4 text-center transition-transform duration-200 hover:-translate-y-1"
                    >
                      <p className="text-sm font-semibold">
                        {formatDate(date)}
                      </p>

                      <img
                        src={info.icon}
                        alt={info.label}
                        className="mx-auto my-5 h-16 w-16 object-contain"
                      />

                      <p className="min-h-10 text-xs text-slate-500">
                        {info.label}
                      </p>

                      <p className="mt-3 text-sm font-bold">
                        {Math.round(weather.daily.temperature_2m_max[i])}°
                        <span className="font-normal text-slate-400">
                          {" / "}
                          {Math.round(weather.daily.temperature_2m_min[i])}°
                        </span>
                      </p>

                      <p className="mt-3 text-xs text-blue-500">
                        ☔ {weather.daily.precipitation_probability_max[i]}%
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </>
      ) : (
        <div className="glass-card rounded-3xl p-8 text-center">
          天気データがありません。
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-slate-400">
        Weather data provided by Open-Meteo
      </footer>
    </main>
  );
}
