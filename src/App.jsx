import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import { Mic, LocateFixed, Navigation, Clock, Milestone, Thermometer, Wind, Droplet } from "lucide-react"; // <-- Import new icons
import AIRecommendations from "./components/AIRecommendations";
import { getRoute, getWeather, getAQI } from "./utils/api"; // <-- Import getAQI

// Helper function to convert AQI number to text
const getAqiText = (aqi) => {
  switch (aqi) {
    case 1: return "Good";
    case 2: return "Fair";
    case 3: return "Moderate";
    case 4: return "Poor";
    case 5: return "Very Poor";
    default: return "N/A";
  }
};

export default function App() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [sourceCoords, setSourceCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [weatherPoints, setWeatherPoints] = useState([]);

  const apiKey = import.meta.env.VITE_API_KEY;

  function cleanPlacesData(dataArray) {
    if (!dataArray || !Array.isArray(dataArray)) return [];
    return dataArray.map((item) => ({
      id: item.properties.place_id,
      name: item.properties.address_line1,
      formatted: item.properties.formatted,
      state: item.properties.state,
      country: item.properties.country,
      lat: item.properties.lat,
      lon: item.properties.lon,
    }));
  }

  const fetchPlaces = async (query, type) => {
    // ... (no changes to this function)
    if (query.length < 3) {
      type === "source" ? setSourceSuggestions([]) : setDestSuggestions([]);
      return;
    }
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
      query
    )}&filter=countrycode:in&limit=10&apiKey=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const suggestions = cleanPlacesData(data.features); 
      if (type === "source") setSourceSuggestions(suggestions);
      else setDestSuggestions(suggestions);
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  // <-- UPDATED FUNCTION: Fetches route, weather, AND AQI
  const handleGetRoute = async () => {
    if (!sourceCoords || !destCoords) {
      alert("Please select a valid source and destination from the list.");
      return;
    }
    clearRoute(); 

    try {
      const routeData = await getRoute(sourceCoords, destCoords); 
      setRoute(routeData); 

      if (routeData.features && routeData.features.length > 0) {
        const properties = routeData.features[0].properties;
        const distance = (properties.distance / 1000).toFixed(2);
        const time = Math.round(properties.time / 60);
        setRouteDetails({ distance, time });

        const coords = routeData.features[0].geometry.coordinates[0];
        const checkpoints = [
          coords[0], // Start
          coords[Math.floor(coords.length / 2)], // Middle
          coords[coords.length - 1] // End
        ];

        // Fetch weather AND AQI for all 3 points in parallel
        const weatherPromises = checkpoints.map(async (point) => {
          const lon = point[0];
          const lat = point[1];
          
          // Call both APIs at the same time
          const [weather, aqi] = await Promise.all([
            getWeather(lat, lon),
            getAQI(lat, lon)
          ]);

          if (!weather) return null; // Skip if weather fails
          
          return { 
            ...weather, 
            aqi: getAqiText(aqi) // Convert number (1-5) to text ("Good", etc.)
          }; 
        });
        
        const newWeatherPoints = (await Promise.all(weatherPromises)).filter(Boolean);
        setWeatherPoints(newWeatherPoints); 
      }
      
    } catch (err) {
      console.error("Error fetching route:", err);
      alert("Could not fetch route. Check console and VITE_API_KEY.");
    }
  };

  const startVoiceInput = (setter) => {
    // ... (no changes to this function)
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteDetails(null);
    setWeatherPoints([]);
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-80 bg-white shadow-xl p-5 flex flex-col gap-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-blue-600">NavAI</h1>
        <div className="flex flex-col gap-4">
          
          {/* SOURCE & DESTINATION (no changes) */}
          {/* ... (source field) ... */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Source" value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  fetchPlaces(e.target.value, "source");
                  setSourceCoords(null); 
                  clearRoute();
                }}
                className="flex-1 p-3 border rounded-xl bg-gray-50"
              />
              <button onClick={() => startVoiceInput(setSource)} className="p-3 bg-blue-600 text-white rounded-xl">
                <Mic size={20} />
              </button>
            </div>
            {sourceSuggestions.length > 0 && (
              <ul className="absolute bg-white shadow-lg border rounded-xl w-full max-h-40 overflow-y-auto mt-1 z-20">
                {sourceSuggestions.map((item, index) => (
                  <li key={index} className="p-2 cursor-pointer hover:bg-blue-100"
                    onClick={() => {
                      setSource(item.formatted); 
                      setSourceCoords(item); 
                      setSourceSuggestions([]);
                    }}>
                    {item.name}, {item.state}, {item.country}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* ... (destination field) ... */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Destination" value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  fetchPlaces(e.target.value, "dest");
                  setDestCoords(null); 
                  clearRoute();
                }}
                className="flex-1 p-3 border rounded-xl bg-gray-50"
              />
              <button onClick={() => startVoiceInput(setDestination)} className="p-3 bg-blue-600 text-white rounded-xl">
                <Mic size={20} />
              </button>
            </div>
            {destSuggestions.length > 0 && (
              <ul className="absolute bg-white shadow-lg border rounded-xl w-full max-h-48 overflow-y-auto mt-1 z-20">
                {destSuggestions.map((item, index) => (
                  <li key={index} className="p-2 cursor-pointer hover:bg-blue-100 text-sm"
                    onClick={() => {
                      setDestination(item.formatted); 
                      setDestCoords(item); 
                      setDestSuggestions([]);
                    }}>
                    {item.name}, {item.state}, {item.country}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button
            onClick={handleGetRoute} 
            className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl cursor-pointer font-semibold"
          >
            <Navigation size={20} />
            Get Route
          </button>
          
          {/* --- UPDATED: ROUTE DETAILS & WEATHER DISPLAY --- */}
          {(routeDetails || weatherPoints.length > 0) && (
            <div className="p-4 bg-gray-100 rounded-xl space-y-3">
              {/* Route Details */}
              {routeDetails && (
                <>
                  <div className="flex items-center gap-2">
                    <Milestone size={20} className="text-blue-600" />
                    <span className="font-semibold">Distance:</span>
                    <span className="text-gray-800">{routeDetails.distance} km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-blue-600" />
                    <span className="font-semibold">Est. Time:</span>
                    <span className="text-gray-800">{routeDetails.time} minutes</span>
                  </div>
                </>
              )}
              
              {/* Weather Details */}
              {weatherPoints.length > 0 && (
                <div className="pt-3 border-t border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                     <Thermometer size={20} className="text-blue-600" />
                     <span className="font-semibold">Weather Along Route</span>
                  </div>
                  {/* We now show a list of places */}
                  <div className="space-y-3">
                    {weatherPoints.map((point, index) => (
                      <div key={index} className="flex gap-2 bg-gray-200 p-2 rounded-lg">
                        <img 
                          src={`https://openweathermap.org/img/wn/${point.icon}.png`} 
                          alt={point.description}
                          className="w-10 h-10 -m-1"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-800">{point.name}</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600 font-semibold">{point.temp}°C</span>
                            <span className="flex items-center gap-1">
                              <Droplet size={12} className="text-blue-600" /> {point.rain} mm
                            </span>
                            <span className="flex items-center gap-1">
                              <Wind size={12} className="text-gray-600" /> {point.aqi}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* --- END OF UPDATED SECTION --- */}
          
          <button
            id="locateMeBtn"
            className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-xl cursor-pointer"
          >
            <LocateFixed size={20} />
            Detect My Location
          </button>
        </div>
      </aside>

      {/* MAP AREA (no changes) */}
      <main className="flex-1 h-full">
        <MapView 
          onLocation={(pos) => setCurrentLocation(pos)} 
          route={route}
        />
        <AIRecommendations coords={currentLocation} />
      </main>
    </div>
  );
}