import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Icon definitions

export const youIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(37,99,235,0.15);
      border:3px solid #2563EB;display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 8px rgba(37,99,235,0.08);">
      <div style="width:13px;height:13px;border-radius:50%;background:#2563EB;"></div>
    </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22],
});

export const demoIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:40px;height:40px;border-radius:50%;background:rgba(234,88,12,0.15);
      border:3px solid #EA580C;display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 0 8px rgba(234,88,12,0.08);">
      <div style="width:13px;height:13px;border-radius:50%;background:#EA580C;"></div>
    </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -22],
});

export const stopIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background-color:#EF4444;
    border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

// Components 

export function UserMarker({ position, demoMode, accuracy }) {
  return (
    <Marker position={position} icon={demoMode ? demoIcon : youIcon}>
      <Popup>
        {demoMode
          ? `Demo position\n${position[0].toFixed(5)}, ${position[1].toFixed(5)}`
          : `You are here${accuracy ? `\n±${Math.round(accuracy)}m` : ''}`}
      </Popup>
    </Marker>
  );
}

export function TransitStopMarkers({ transitStops }) {
  return transitStops.map((seg, idx) => (
    <React.Fragment key={idx}>
      <Marker position={[seg.deplat, seg.deplon]} icon={stopIcon}>
        <Popup>
          <div style={{ fontSize: 13 }}>
            <strong style={{ color: '#000' }}>{seg.lineName}</strong><br />
            <b>Departure:</b> {seg.departureStop}
          </div>
        </Popup>
      </Marker>
      <Marker position={[seg.arrlat, seg.arrlon]} icon={stopIcon}>
        <Popup>
          <div style={{ fontSize: 13 }}>
            <strong style={{ color: '#000' }}>{seg.lineName}</strong><br />
            <b>Arrival:</b> {seg.arrivalStop}<br />
            <small>{seg.stopCount} stops</small>
          </div>
        </Popup>
      </Marker>
    </React.Fragment>
  ));
}