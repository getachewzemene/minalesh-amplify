'use client'

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Ethiopian cities coordinates (approximate)
const ETHIOPIAN_CITIES: Record<string, { lat: number; lng: number }> = {
  'Addis Ababa': { lat: 9.0320, lng: 38.7469 },
  'Dire Dawa': { lat: 9.5930, lng: 41.8661 },
  'Mekele': { lat: 13.4967, lng: 39.4753 },
  'Gondar': { lat: 12.6000, lng: 37.4667 },
  'Awasa': { lat: 7.0500, lng: 38.4667 },
  'Bahir Dar': { lat: 11.5933, lng: 37.3906 },
  'Jimma': { lat: 7.6833, lng: 36.8333 },
  'Jijiga': { lat: 9.3500, lng: 42.8000 },
  'Harar': { lat: 9.3131, lng: 42.1180 },
  'Dessie': { lat: 11.1333, lng: 39.6333 },
  'Adama': { lat: 8.5400, lng: 39.2689 },
  'Nekemte': { lat: 9.0833, lng: 36.5500 },
  'Debre Birhan': { lat: 9.6833, lng: 39.5333 },
  'Asella': { lat: 7.9500, lng: 39.1333 },
  'Debre Markos': { lat: 10.3500, lng: 37.7333 },
};

export default function GeographicHeatmap({ data, height = '400px' }: GeographicHeatmapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Ethiopia
    const map = L.map(mapContainerRef.current).setView([9.145, 40.489673], 6);
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
