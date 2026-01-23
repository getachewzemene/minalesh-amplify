'use client'

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Location3D {
  lat: number;
  lng: number;
  elevation?: number;
}

interface Terrain3DMapProps {
  warehouse: Location3D & { name: string };
  destination: Location3D & { address: string; city: string };
  courierLocation?: Location3D | null;
  routePath?: Location3D[];
  mapboxAccessToken?: string; // Optional: uses demo token if not provided
  height?: string;
  enableTerrain?: boolean;
  enable3DBuildings?: boolean;
  mapStyle?: 'streets' | 'satellite' | 'outdoors' | 'dark' | 'light';
}

const DEFAULT_DEMO_TOKEN = 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja2x2dDd2dncwMGFtMm5xczN5bTJpMjU3In0.example'; // Demo token

export default function Terrain3DMap({
  warehouse,
  destination,
  courierLocation,
  routePath = [],
  mapboxAccessToken,
  height = '500px',
  enableTerrain = true,
  enable3DBuildings = true,
  mapStyle = 'outdoors',
}: Terrain3DMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map style URLs
  const styleUrls = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use provided token or demo token (will show watermark)
    const token = mapboxAccessToken || DEFAULT_DEMO_TOKEN;
    
    // Note: For production, you need a valid Mapbox access token
    // Get one free at: https://account.mapbox.com/access-tokens/
    if (token === DEFAULT_DEMO_TOKEN) {
      setError('Mapbox token not configured. Using fallback 2D view.');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: styleUrls[mapStyle],
        center: [(warehouse.lng + destination.lng) / 2, (warehouse.lat + destination.lat) / 2],
        zoom: 11,
        pitch: 45, // Tilt the map for 3D effect
        bearing: 0,
        antialias: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        setIsMapLoaded(true);

        // Add 3D terrain
        if (enableTerrain) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });

          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

          // Add sky layer for better 3D visualization
          map.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15,
            },
          });
        }

        // Add 3D buildings
        if (enable3DBuildings) {
          const layers = map.getStyle().layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout
          )?.id;

          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15.05,
                  ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14,
                  0,
                  15.05,
                  ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              },
            },
            labelLayerId
          );
        }

        // Add warehouse marker
        const warehouseEl = document.createElement('div');
        warehouseEl.className = 'warehouse-marker-3d';
        warehouseEl.innerHTML = '📦';
        warehouseEl.style.fontSize = '32px';
        warehouseEl.style.cursor = 'pointer';

        new mapboxgl.Marker(warehouseEl)
          .setLngLat([warehouse.lng, warehouse.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <strong style="color: #3b82f6;">Warehouse</strong><br/>
                <span style="font-size: 12px;">${warehouse.name}</span>
                ${warehouse.elevation ? `<br/><span style="font-size: 11px; color: #666;">Elevation: ${warehouse.elevation}m</span>` : ''}
              </div>`
            )
          )
          .addTo(map);

        // Add destination marker
        const destEl = document.createElement('div');
        destEl.className = 'destination-marker-3d';
        destEl.innerHTML = '🏠';
        destEl.style.fontSize = '32px';
        destEl.style.cursor = 'pointer';

        new mapboxgl.Marker(destEl)
          .setLngLat([destination.lng, destination.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<div style="padding: 8px;">
                <strong style="color: #10b981;">Destination</strong><br/>
                <span style="font-size: 12px;">${destination.address}</span><br/>
                <span style="font-size: 11px; color: #666;">${destination.city}</span>
                ${destination.elevation ? `<br/><span style="font-size: 11px; color: #666;">Elevation: ${destination.elevation}m</span>` : ''}
              </div>`
            )
          )
          .addTo(map);

        // Add courier marker if location available
        if (courierLocation) {
          const courierEl = document.createElement('div');
          courierEl.className = 'courier-marker-3d';
          courierEl.innerHTML = '🚗';
          courierEl.style.fontSize = '32px';
          courierEl.style.cursor = 'pointer';

          new mapboxgl.Marker(courierEl)
            .setLngLat([courierLocation.lng, courierLocation.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div style="padding: 8px;">
                  <strong style="color: #f59e0b;">Courier</strong><br/>
                  <span style="font-size: 12px;">Current Position</span>
                  ${courierLocation.elevation ? `<br/><span style="font-size: 11px; color: #666;">Elevation: ${courierLocation.elevation}m</span>` : ''}
                </div>`
              )
            )
            .addTo(map);
        }

        // Add route line if path provided
        if (routePath.length > 0) {
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routePath.map(p => [p.lng, p.lat]),
              },
            },
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });
        } else {
          // Draw simple line from warehouse to destination
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [
                  [warehouse.lng, warehouse.lat],
                  ...(courierLocation ? [[courierLocation.lng, courierLocation.lat]] : []),
                  [destination.lng, destination.lat],
                ],
              },
            },
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#10b981',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          });
        }

        // Fit bounds to show all markers
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([warehouse.lng, warehouse.lat]);
        bounds.extend([destination.lng, destination.lat]);
        if (courierLocation) {
          bounds.extend([courierLocation.lng, courierLocation.lat]);
        }

        map.fitBounds(bounds, { padding: 80 });
      });

      map.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load 3D map. Using fallback 2D view.');
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add fullscreen control
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError('Failed to initialize 3D map. Check Mapbox token.');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [warehouse, destination, courierLocation, routePath, mapboxAccessToken, mapStyle, enableTerrain, enable3DBuildings]);

  if (error) {
    return (
      <div 
        style={{ height, width: '100%' }}
        className="flex items-center justify-center border border-border rounded-lg bg-gray-50"
      >
        <div className="text-center p-6">
          <div className="text-4xl mb-2">🗺️</div>
          <div className="text-sm font-medium text-gray-700">{error}</div>
          <div className="text-xs text-gray-500 mt-2">
            To enable 3D terrain visualization, configure NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border border-border"
      />
      {isMapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
          <div className="font-semibold mb-1">3D View Controls</div>
          <div className="text-gray-600 space-y-1">
            <div>• Right-click + drag to rotate</div>
            <div>• Ctrl + drag to adjust pitch</div>
            <div>• Scroll to zoom</div>
          </div>
        </div>
      )}
    </div>
  );
}
