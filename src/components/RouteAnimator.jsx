// src/components/RouteAnimator.jsx
import "leaflet.markerplayer";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// 1. Import your car icon
import carIconUrl from "../assets/car.png"; // Adjust path if needed

export default function RouteAnimator({ route }) {
  const map = useMap();
  const playerRef = useRef(null); // To keep track of the animation player

  // 2. Define the car icon for Leaflet
  const carIcon = L.icon({
    iconUrl: carIconUrl,
    iconSize: [32, 32], // Adjust size as needed
    iconAnchor: [16, 16], // Point of the icon which will correspond to marker's location
  });

  useEffect(() => {
    // 3. Clean up any previous animation when the route changes
    if (playerRef.current) {
      map.removeLayer(playerRef.current);
      playerRef.current = null;
    }

    // 4. Check if we have a new route to animate
    if (!route || !route.features) {
      return;
    }

    // 5. Get coordinates from the route GeoJSON
    // (OpenRouteService gives [lng, lat], Leaflet needs [lat, lng])
    const coordinates = route.features[0].geometry.coordinates;
    const latLngs = coordinates.map(coord => [coord[1], coord[0]]); // Flip them!

    // 6. Create the animation player
    const player = L.markerPlayer(latLngs, {
      icon: carIcon,
      duration: 8000, // Total animation duration in milliseconds (e.g., 8 seconds)
      loop: false,
      autostart: true, // Start immediately
    });

    // 7. Add the animation to the map
    player.addTo(map);
    playerRef.current = player; // Save for cleanup

    // 8. (Optional) Zoom in on the start of the route
    if (latLngs.length > 0) {
      map.setView(latLngs[0], 16); // Set view to start, zoom level 16
    }

  }, [route, map]); // This effect re-runs every time the 'route' prop changes

  return null; // This component just adds to the map, it doesn't render any HTML
}