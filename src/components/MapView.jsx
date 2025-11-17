import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
import L from "leaflet";
// We no longer need renderToStaticMarkup

// User icon definition
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [35, 35],
});

// We no longer need the createWeatherIcon function

function MapController({ route, position }) {
  const map = useMap();

  useEffect(() => {
    if (route && route.features) {
      try {
        const bounds = L.geoJSON(route).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      } catch (err) {
        console.error("Could not fit route bounds:", err);
      }
    }
  }, [route, map]);

  useEffect(() => {
    if (position[0] !== 28.6139 && position[1] !== 77.209) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return null;
}

function LocationFinder({ onLocation }) {
  const map = useMap();
  useEffect(() => {
    map.locate();
    map.on("locationfound", (e) => {
      onLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.on("locationerror", (e) => {
      console.error("Location access denied.", e.message);
    });
  }, [map, onLocation]);
  return null;
}

// MapView no longer accepts 'weatherPoints'
export default function MapView({ onLocation, route }) {
  const [position, setPosition] = useState([28.6139, 77.209]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (loc) => {
        setPosition([loc.coords.latitude, loc.coords.longitude]);
      },
      () => alert("Unable to get location")
    );
  };

  useEffect(() => {
    const btn = document.getElementById("locateMeBtn");
    if (btn) btn.addEventListener("click", getCurrentLocation);
    return () => {
      if (btn) btn.removeEventListener("click", getCurrentLocation);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <MapContainer center={position} zoom={13} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={position} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* This draws the blue route line */}
        {route && <GeoJSON data={route} />}

        <MapController route={route} position={position} />
        <LocationFinder onLocation={onLocation} />

        {/* All weather marker logic is GONE */}

      </MapContainer>
    </div>
  );
}