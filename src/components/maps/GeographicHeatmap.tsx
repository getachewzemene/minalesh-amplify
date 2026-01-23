'use client'

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ETHIOPIAN_CITIES, ETHIOPIA_MAP_CENTER, ETHIOPIA_DEFAULT_ZOOM } from '@/lib/ethiopian-cities';
import { fixLeafletIcons } from '@/lib/leaflet-config';

interface LocationData {
  city: string;
  lat: number;
  lng: number;
  orders: number;
  revenue: number;
}

interface GeographicHeatmapProps {
  data: LocationData[];
  height?: string;
}

export default function GeographicHeatmap({ data, height = '400px' }: GeographicHeatmapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix Leaflet icons for Next.js
    fixLeafletIcons();

    // Initialize map centered on Ethiopia
    const map = L.map(mapContainerRef.current).setView(
      [ETHIOPIA_MAP_CENTER.lat, ETHIOPIA_MAP_CENTER.lng],
      ETHIOPIA_DEFAULT_ZOOM
    );
    mapRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !data || data.length === 0) return;

    const map = mapRef.current;

    // Clear existing layers (except base tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Find max revenue for scaling
    const maxRevenue = Math.max(...data.map(d => d.revenue));

    // Add markers and circles for each location
    data.forEach((location) => {
      // Get coordinates from our Ethiopian cities database or use provided coordinates
      const coords = ETHIOPIAN_CITIES[location.city] || { lat: location.lat, lng: location.lng };
      
      if (!coords || !coords.lat || !coords.lng) return;

      // Calculate radius based on revenue (scale 5-50 pixels)
      const radius = 5000 + (location.revenue / maxRevenue) * 45000;
      const intensity = location.revenue / maxRevenue;

      // Add circle with heat effect
      const circle = L.circle([coords.lat, coords.lng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2 + (intensity * 0.5),
        radius: radius,
        weight: 2,
      }).addTo(map);

      // Add marker with popup
      const marker = L.marker([coords.lat, coords.lng]).addTo(map);
      
      // Format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
          style: 'currency',
          currency: 'ETB',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      };

      marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong style="font-size: 14px;">${location.city}</strong>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            <div><strong>Orders:</strong> ${location.orders.toLocaleString()}</div>
            <div><strong>Revenue:</strong> ${formatCurrency(location.revenue)}</div>
          </div>
        </div>
      `);
    });

    // Fit map to show all markers
    if (data.length > 0) {
      const bounds = L.latLngBounds(
        data
          .filter(d => {
            const coords = ETHIOPIAN_CITIES[d.city] || { lat: d.lat, lng: d.lng };
            return coords && coords.lat && coords.lng;
          })
          .map(d => {
            const coords = ETHIOPIAN_CITIES[d.city] || { lat: d.lat, lng: d.lng };
            return [coords.lat, coords.lng] as [number, number];
          })
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [data]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height, width: '100%', borderRadius: '8px' }}
      className="z-0"
    />
  );
}
