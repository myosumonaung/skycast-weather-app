
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/* ========================================
   Types
======================================== */

type City = {
  name: string;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
  };

  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };

  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    uv_index_max: number[];
  };
};

/* ========================================
   Cities
======================================== */

const cities: City[] = [
  {
    name: "東京",
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    name: "大阪",
    latitude: 34.6937,
    longitude: 135.5023,
  },
  {
    name: "京都",
    latitude: 35.0116,
    longitude: 135.7681,
  },
  {
    name: "熊本",
    latitude: 32.8031,
    longitude: 130.7079,
  },
  {
    name: "米沢",
    latitude: 37.9222,
    longitude: 140.1168,
  },
  {
    name: "札幌",
    latitude: 43.0618,
    longitude: 141.3545,
  },
  {
    name: "福岡",
    latitude: 33.5902,
    longitude: 130.4017,
  },
  {
    name: "名古屋",
    latitude: 35.1815,
    longitude: 136.9066,
  },
  {
    name: "沖縄",
    latitude: 26.2124,
    longitude: 127.6809,
  },
];

/* ========================================
   Weather Information
======================================== */

function getWeatherInfo(code: number) {
  if (code === 0) {
    return {
      label: "快晴",
      icon: "/icons/sunny.png",
      gradient: "from-amber-400 to-orange-400",
    };
  }

  if (code <= 2) {
    return {
      label: "晴れ時々くもり",
      icon: "/icons/partly-cloudy.png",
      gradient: "from-amber-400 to-orange-500",
    };
  }

  if (code === 3) {
    return {
      label: "くもり",
      icon: "/icons/cloudy.png",
      gradient: "from-blue-400 to-indigo-500",
    };
  }

  if (code <= 48) {
    return {
      label: "霧",
      icon: "/icons/fog.png",
      gradient: "from-slate-400 to-blue-500",
    };
  }

  if (code <= 67 || (code >= 80 && code <= 82)) {
    return {
      label: "雨",
      icon: "/icons/rain.png",
      gradient: "from-blue-500 to-indigo-600",
    };
  }

  if (code <= 77 || (code >= 85 && code <= 86)) {
    return {
      label: "雪",
      icon: "/icons/snow.png",
      gradient: "from-sky-300 to-blue-500",
    };
  }

  if (code >= 95) {
    return {
      label: "雷雨",
      icon: "/icons/thunderstorm.png",
      gradient: "from-indigo-600 to-purple-700",
    };
  }

  return {
    label: "くもり",
    icon: "/icons/cloudy.png",
    gradient: "from-blue-400 to-indigo-500",
  };
}

/* ========================================
   Date Formatting
======================================== */

function formatDate(date: string) {
  const d = new Date(`${date}T12:00:00`);

  const weekdays = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土",
  ];

  return `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
}

/* ========================================
   Main Component
======================================== */

export default function Home() {
  const [city, setCity] = useState<City>(cities[0]);

  const [search, setSearch] = useState("");

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ========================================
     Fetch Weather
  ======================================== */

  useEffect(() => {
    const controller = new AbortController();

    async function fetchWeather() {
      setLoading(true);
      setError("");
      setWeather(null);

      try {
        const params = new URLSearchParams({
          latitude: String(city.latitude),
          longitude: String(city.longitude),

          current: [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "wind_speed_10m",
            "weather_code",
          ].join(","),

          hourly: [
            "temperature_2m",
            "precipitation_probability",
            "weather_code",
          ].join(","),

          daily: [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "uv_index_max",
          ].join(","),

          timezone: "Asia/Tokyo",
          forecast_days: "8",
        });

        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("天気情報を取得できませんでした。");
        }

        const data: WeatherData = await response.json();

        setWeather(data);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "エラーが発生しました。"
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => controller.abort();
  }, [city]);

  /* ========================================
     City Search
  ======================================== */

  async function handleSearch() {
    const query = search.trim();

    if (!query) return;

    const existing = cities.find(
      (item) =>
        item.name.toLowerCase() === query.toLowerCase()
    );

    if (existing) {
      setCity(existing);
      setSearch("");
      return;
    }

    try {
      setError("");

      const params = new URLSearchParams({
        name: query,
        count: "10",
        language: "ja",
      });

      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${params}`
      );

      if (!response.ok) {
        throw new Error("都市を検索できませんでした。");
      }

      const data = await response.json();

      const result = data.results?.find(
        (item: { country_code?: string }) =>
          item.country_code === "JP"
      );

      if (!result) {
        setError("日本国内の都市が見つかりませんでした。");
        return;
      }

      setCity({
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
      });

      setSearch("");
    } catch {
      setError("都市の検索に失敗しました。");
    }
  }

  /* ========================================
     Current Weather Information
  ======================================== */

  const currentInfo = weather
    ? getWeatherInfo(weather.current.weather_code)
    : null;

  /* ========================================
     Hourly Forecast
  ======================================== */

  const now = new Date();

  const currentHour = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}T${String(
    now.getHours()
  ).padStart(2, "0")}:00`;

  const hourlyStart = weather
    ? Math.max(
        0,
        weather.hourly.time.findIndex(
          (time) => time >= currentHour
        )
      )
    : 0;

  const hourlyForecast = weather
    ? weather.hourly.time
        .slice(hourlyStart, hourlyStart + 24)
        .map((time, index) => {
          const i = hourlyStart + index;

          return {
            time,
            temperature:
              weather.hourly.temperature_2m[i],
            precipitation:
              weather.hourly.precipitation_probability[i],
            code: weather.hourly.weather_code[i],
          };
        })
    : [];

  /* ========================================
     Render
  ======================================== */

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}

      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="mb-2 text-xs font-bold tracking-[0.3em] text-blue-500">
            WEATHER DASHBOARD
          </p>

          <h1 className="text-4xl font-bold text-[#172b4d]">
            SkyCast ☁️
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            あなたの街の天気を、もっと身近に。
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">

          {/* Search */}

          <div className="glass-card flex w-full items-center rounded-2xl px-4 py-3 sm:w-64">

            <span className="mr-2">🔍</span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="都市を検索..."
              aria-label="都市を検索"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />

            <button
              type="button"
              onClick={handleSearch}
              aria-label="検索を実行"
              className="ml-2 text-blue-500"
            >
              →
            </button>
          </div>

          {/* City Selector */}

          <select
            value={
              cities.some(
                (item) =>
                  item.name === city.name &&
                  item.latitude === city.latitude &&
                  item.longitude === city.longitude
              )
                ? city.name
                : ""
            }
            onChange={(e) => {
              const selected = cities.find(
                (item) => item.name === e.target.value
              );

              if (selected) {
                setCity(selected);
              }
            }}
            aria-label="都市を選択"
            className="glass-card w-full rounded-2xl px-4 py-3 text-sm outline-none sm:w-32"
          >
            {!cities.some(
              (item) =>
                item.name === city.name &&
                item.latitude === city.latitude &&
                item.longitude === city.longitude
            ) && (
              <option value="">
                {city.name}
              </option>
            )}

            {cities.map((item) => (
              <option
                key={item.name}
                value={item.name}
              >
                {item.name}
              </option>
            ))}
          </select>

        </div>
      </header>

      {/* Loading */}

      {loading && (
        <div
          role="status"
          className="glass-card rounded-3xl p-10 text-center"
        >
          天気情報を読み込み中...
        </div>
      )}

      {/* Error */}

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-2xl bg-red-50 p-5 text-red-600"
        >
          エラー：{error}
        </div>
      )}

      {/* Weather Dashboard */}

      {weather && currentInfo && (
        <div className="space-y-10">

          {/* Current Weather */}

          <section
            className={`weather-card rounded-3xl bg-gradient-to-br ${currentInfo.gradient} p-6 text-white shadow-xl sm:p-10`}
          >

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-medium text-white/80">
                  CURRENT WEATHER
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {city.name}の天気
                </h2>

                <p className="mt-8 text-6xl font-bold sm:text-7xl">
                  {Math.round(
                    weather.current.temperature_2m
                  )}
                  °
                </p>

                <p className="mt-5 text-lg font-semibold">
                  {currentInfo.label}
                </p>

                <p className="mt-3 text-sm text-white/80">
                  風速{" "}
                  {weather.current.wind_speed_10m.toFixed(
                    1
                  )}{" "}
                  km/h
                </p>

              </div>

              <Image
                src={currentInfo.icon}
                alt={currentInfo.label}
                width={180}
                height={180}
                priority
                className="weather-icon mx-auto h-28 w-28 object-contain sm:mx-0 sm:h-44 sm:w-44"
              />

            </div>

          </section>

          {/* Weather Details */}

          <section>

            <h2 className="mb-5 text-2xl font-bold">
              天気の詳細
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              <div className="glass-card rounded-2xl p-4 sm:p-5">

                <p className="text-sm text-slate-500">
                  💧 湿度
                </p>

                <p className="mt-4 text-2xl font-bold">
                  {weather.current.relative_humidity_2m}%
                </p>

              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-5">

                <p className="text-sm text-slate-500">
                  🌡️ 体感温度
                </p>

                <p className="mt-4 text-2xl font-bold">
                  {Math.round(
                    weather.current.apparent_temperature
                  )}
                  °C
                </p>

              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-5">

                <p className="text-sm text-slate-500">
                  🌬️ 風速
                </p>

                <p className="mt-4 text-2xl font-bold">
                  {weather.current.wind_speed_10m.toFixed(
                    1
                  )}
                  <span className="ml-1 text-sm">
                    km/h
                  </span>
                </p>

              </div>

              <div className="glass-card rounded-2xl p-4 sm:p-5">

                <p className="text-sm text-slate-500">
                  ☀️ UV指数（今日の最大）
                </p>

                <p className="mt-4 text-2xl font-bold">
                  {weather.daily.uv_index_max[0].toFixed(
                    2
                  )}
                </p>

              </div>

            </div>

          </section>

          {/* 24 Hour Forecast */}

          <section>

            <div className="mb-5 flex items-center justify-between gap-3">

              <h2 className="text-xl font-bold sm:text-2xl">
                24時間の天気予報
              </h2>

              <span className="text-xs text-slate-500">
                NEXT 24 HOURS
              </span>

            </div>

            <div className="flex gap-3 overflow-x-auto pb-4">

              {hourlyForecast.map((hour) => {
                const info = getWeatherInfo(hour.code);

                return (
                  <div
                    key={hour.time}
                    className="glass-card flex w-24 shrink-0 flex-col items-center justify-between gap-3 rounded-2xl p-4 text-center"
                  >

                    <p className="text-sm">
                      {hour.time.slice(11, 16)}
                    </p>

                    <Image
                      src={info.icon}
                      alt={info.label}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                    />

                    <p className="text-xl font-bold">
                      {Math.round(
                        hour.temperature
                      )}
                      °
                    </p>

                    <p className="text-xs text-blue-500">
                      ☔ {hour.precipitation}%
                    </p>

                  </div>
                );
              })}

            </div>

          </section>

          {/* 7 Day Forecast */}

          <section>

            <div className="mb-5 flex items-center justify-between gap-3">

              <h2 className="text-xl font-bold sm:text-2xl">
                7日間の天気予報
              </h2>

              <span className="text-xs text-slate-500">
                NEXT 7 DAYS
              </span>

            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              {weather.daily.time
                .slice(0, 7)
                .map((date, index) => {
                  const info = getWeatherInfo(
                    weather.daily.weather_code[index]
                  );

                  return (
                    <div
                      key={date}
                      className="glass-card flex min-w-0 flex-col items-center rounded-2xl p-4 text-center sm:p-6"
                    >

                      <p className="text-sm font-bold">
                        {formatDate(date)}
                      </p>

                      <Image
                        src={info.icon}
                        alt={info.label}
                        width={72}
                        height={72}
                        className="my-5 h-16 w-16 object-contain"
                      />

                      <p className="min-h-10 text-sm text-slate-500">
                        {info.label}
                      </p>

                      <p className="mt-4 font-bold">
                        {Math.round(
                          weather.daily.temperature_2m_max[
                            index
                          ]
                        )}
                        °

                        <span className="text-slate-400">
                          {" / "}
                          {Math.round(
                            weather.daily.temperature_2m_min[
                              index
                            ]
                          )}
                          °
                        </span>
                      </p>

                      <p className="mt-3 text-sm text-blue-500">
                        ☔{" "}
                        {
                          weather.daily
                            .precipitation_probability_max[
                            index
                          ]
                        }
                        %
                      </p>

                    </div>
                  );
                })}

            </div>

          </section>

        </div>
      )}

      {/* Footer */}

      <footer className="mt-12 border-t border-white/50 pt-6 text-center text-xs text-slate-500">

        <p>
          SkyCast - Modern Weather Dashboard
        </p>

        <p className="mt-2">
          Weather data provided by{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Open-Meteo
          </a>
        </p>

      </footer>

    </main>
  );
}
