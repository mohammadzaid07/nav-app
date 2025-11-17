import axios from "axios";

export const GEOAPIFY_KEY = import.meta.env.VITE_API_KEY || "";
export const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || "";
export const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";

export async function getRoute(source, dest) {
  if (!GEOAPIFY_KEY) {
    throw new Error("Missing Geoapify API key in VITE_API_KEY");
  }
  const url = `https://api.geoapify.com/v1/routing?waypoints=${source.lat},${source.lon}|${dest.lat},${dest.lon}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
  try {
    const res = await axios.get(url);
    return res.data; 
  } catch (err) {
    console.error("Error fetching route from Geoapify:", err);
    throw err;
  }
}

// --- UPDATED FUNCTION ---
export async function getWeather(lat, lon) {
  if (!WEATHER_API_KEY) { 
    throw new Error("Missing OpenWeatherMap API key in VITE_OPENWEATHER_API_KEY");
  }
  
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
  
  try {
    const res = await axios.get(url);
    // Check for rain data, default to 0 if not raining
    const rain = res.data.rain ? res.data.rain["1h"] : 0; 

    return {
      temp: Math.round(res.data.main.temp),
      description: res.data.weather[0].description,
      icon: res.data.weather[0].icon,
      name: res.data.name,
      rain: rain, // <-- ADDED RAIN
    };
  } catch (err) {
    console.error("Error fetching weather:", err);
    return null;
  }
}

// --- NEW FUNCTION ---
export async function getAQI(lat, lon) {
  if (!WEATHER_API_KEY) {
    throw new Error("Missing OpenWeatherMap API key in VITE_OPENWEATHER_API_KEY");
  }
  // Call the separate Air Pollution API
  const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
  
  try {
    const res = await axios.get(url);
    // AQI is an index from 1 (Good) to 5 (Very Poor)
    return res.data.list[0].main.aqi; 
  } catch (err) {
    console.error("Error fetching AQI:", err);
    return null;
  }
}

// --- Your other functions ---
export async function fetchOverpass(lat, lon, radius = 300) {
  // ... (no changes)
}

export async function hfTextGeneration(prompt, max_new_tokens = 120) {
  // ... (no changes)
}

export async function hfZeroShotClassification(text, labels) {
  // ... (no changes)
}