import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { map.setView(position, map.getZoom()); }, [position]);
  return null;
}

export function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

export function FitRouteBounds({ data }) {
  const map = useMap();
  useEffect(() => {
    if (data) map.fitBounds(L.geoJSON(data).getBounds(), { padding: [50, 50] });
  }, [data, map]);
  return null;
}