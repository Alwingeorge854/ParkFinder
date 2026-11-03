import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './mapbar.css';
import { useEffect, useState } from 'react';

const API_URL = 'https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json';
const ZOOM = 10;

function MapMovement({onViewChange}){
    const bound = useMapEvents({
        moveend: () => onViewChange(bound.getBounds(),bound.getZoom()), 
    });

    useEffect(() => {
        onViewChange(bound.getBounds(),bound.getZoom());
    },[]);

    return null;
}

function getBayStyle(status) {
  if (status === 'Present') {
    return { color: '#b91c1c', fillColor: '#ef4444', fillOpacity: 0.85, weight: 2 }; // red = occupied
  }
  if (status === 'Unoccupied') {
    return { color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.85, weight: 2 }; // green = free
  }
  return { color: '#6b7280', fillColor: '#9ca3af', fillOpacity: 0.6, weight: 1 };    // grey = unknown
}

function Mapbar() {
    const position = [-37.8146640, 144.9625200]; // Default position (latitude, longitude)
    const [totalCount, setTotalCount] = useState(0);
    const [bays, setBays] = useState([]);        // the parking data
    const [loading, setLoading] = useState(true); // true while waiting
    const [error, setError] = useState(null);
    const [view, setView] = useState(null); 

    useEffect(() => {
    if (!view) return;                     // the map hasn't reported its view yet

    if (view.zoom < ZOOM) {            // zoomed out too far: clear the dots and stop
      setBays([]);
      setTotalCount(0);
      return;
    }

    const controller = new AbortController();

    // Wait 300 ms after movement stops before fetching (see "debouncing" below)
    const timer = setTimeout(async () => {
      const b = view.bounds;
      const where = `in_bbox(location, ${b.getNorth()}, ${b.getWest()}, ${b.getSouth()}, ${b.getEast()})`;
      const url = `${API_URL}?where=${encodeURIComponent(where)}`;

      try {
        setLoading(true);
        setError(null);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results ?? [];
        setBays(list);
        setTotalCount(list.total_count ?? 0);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err);   // ignore requests we cancelled on purpose
      } finally {
        setLoading(false);
      }
    }, 300);

    // Cleanup: runs when the view changes again before this request finishes
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [view]); 

  return (
    <div className = "mapbar">
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" , borderRadius: "25px" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapMovement onViewChange={(bounds, zoom) => setView({ bounds, zoom })} />

        {bays
          .filter((bay) => bay.location)
          .map((bay) => (
            <CircleMarker
              key={bay.kerbsideid}
              center={[bay.location.lat, bay.location.lon]}
              radius={8}
              pathOptions={getBayStyle(bay.status_description)}
            >
              <Popup>
                Bay ID: {bay.kerbsideid}<br />
                Status: {bay.status_description}<br />
                Last updated: {new Date(bay.lastupdated).toLocaleString()}
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>

  );
}

export default Mapbar;
