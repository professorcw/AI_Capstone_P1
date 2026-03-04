import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import InfoTooltip from './InfoTooltip';

function severityColor(avgSeverity) {
  if (avgSeverity <= 1.5) return '#2ecc71';
  if (avgSeverity <= 2.0) return '#d4a017';
  if (avgSeverity <= 2.5) return '#e67e22';
  return '#e74c3c';
}

function markerRadius(count) {
  return Math.max(4, Math.log(count) * 2);
}

export default function InteractiveMap({ cities }) {
  const markers = useMemo(() => {
    if (!cities || cities.length === 0) return [];
    return cities.map(city => ({
      ...city,
      color: severityColor(city.avg_severity),
      radius: markerRadius(city.count)
    }));
  }, [cities]);

  return (
    <div className="map-container" role="region" aria-label="Interactive accident map">
      <h2 className="section-title">
        Geographic Hotspots
        <InfoTooltip
          title="Geographic Hotspots"
          description="Top 200 cities by total accident count, displayed as circle markers on the map. Circle size scales logarithmically with accident volume; color indicates average severity."
          usage="Click any marker for city details including total accidents, average severity, and top weather condition. Use state filters to zoom into specific regions."
          why="Reveals geographic concentration of accidents. Helps the DOT identify which cities need the most attention — but remember that high counts may partly reflect better API reporting coverage in that area."
        />
      </h2>
      <MapContainer
        center={[39.8, -98.5]}
        zoom={4}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((city, i) => (
          <CircleMarker
            key={`${city.city}-${city.state}-${i}`}
            center={[city.lat, city.lng]}
            radius={city.radius}
            pathOptions={{
              fillColor: city.color,
              color: '#1B2A4A',
              weight: 1,
              opacity: 0.8,
              fillOpacity: 0.6
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{city.city}, {city.state}</strong>
                <div>Total Accidents: {city.count.toLocaleString()}</div>
                <div>Avg Severity: {city.avg_severity.toFixed(2)}</div>
                <div>Top Weather: {city.top_weather}</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="map-legend">
        <span className="legend-title">Avg Severity:</span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#2ecc71' }} />
          ≤1.5
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#d4a017' }} />
          1.5–2.0
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#e67e22' }} />
          2.0–2.5
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#e74c3c' }} />
          &gt;2.5
        </span>
      </div>
    </div>
  );
}
