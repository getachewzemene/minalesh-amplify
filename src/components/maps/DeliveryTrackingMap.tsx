'use client'

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ETHIOPIAN_CITIES, DEFAULT_WAREHOUSE_LOCATION } from '@/lib/ethiopian-cities';
import { fixLeafletIcons } from '@/lib/leaflet-config';

interface DeliveryTrackingMapProps {
  origin?: { city: string; lat?: number; lng?: number };
  destination: { 
    city: string; 
    fullAddress: string;
    lat?: number; 
    lng?: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  height?: string;
}

export default function DeliveryTrackingMap({ 
  origin, 
  destination, 
  status, 
  height = '350px' 
}: DeliveryTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix Leaflet icons for Next.js
    fixLeafletIcons();

    // Get destination coordinates
    const destCoords = ETHIOPIAN_CITIES[destination.city] || 
                       { lat: destination.lat || 9.0320, lng: destination.lng || 38.7469 };

    // Initialize map centered on destination
    const map = L.map(mapContainerRef.current).setView([destCoords.lat, destCoords.lng], 12);
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
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing layers (except base tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Get coordinates
    const originCoords = origin 
      ? (ETHIOPIAN_CITIES[origin.city] || { lat: origin.lat || DEFAULT_WAREHOUSE_LOCATION.lat, lng: origin.lng || DEFAULT_WAREHOUSE_LOCATION.lng })
      : DEFAULT_WAREHOUSE_LOCATION;

    const destCoords = ETHIOPIAN_CITIES[destination.city] || 
                       { lat: destination.lat || 9.0320, lng: destination.lng || 38.7469 };

    // Create custom icons
    const createIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color}; 
            width: 32px; 
            height: 32px; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 12px;
            ">${label}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    };

    // Add origin marker (warehouse/seller)
    if (origin) {
      const originMarker = L.marker([originCoords.lat, originCoords.lng], {
        icon: createIcon('#3b82f6', 'W'),
      }).addTo(map);

      originMarker.bindPopup(`
        <div style="font-family: sans-serif;">
          <strong style="font-size: 14px;">Warehouse/Seller</strong>
          <div style="margin-top: 4px; font-size: 12px; color: #666;">
            ${origin.city}
          </div>
        </div>
      `);
    }

    // Determine destination marker color based on status
    let destColor = '#10b981'; // green for delivered
    let destLabel = '✓';
    
    if (status === 'shipped') {
      destColor = '#f59e0b'; // orange for in transit
      destLabel = '→';
    } else if (status === 'cancelled') {
      destColor = '#ef4444'; // red for cancelled
      destLabel = '✗';
    } else if (['pending', 'confirmed', 'processing'].includes(status)) {
      destColor = '#6b7280'; // gray for not yet shipped
      destLabel = '◉';
    }

    // Add destination marker
    const destMarker = L.marker([destCoords.lat, destCoords.lng], {
      icon: createIcon(destColor, destLabel),
    }).addTo(map);

    destMarker.bindPopup(`
      <div style="font-family: sans-serif;">
        <strong style="font-size: 14px;">Delivery Address</strong>
        <div style="margin-top: 4px; font-size: 12px; color: #666;">
          ${destination.fullAddress}<br/>
          ${destination.city}
        </div>
        <div style="margin-top: 6px; font-size: 11px;">
          <span style="
            padding: 2px 8px; 
            background: ${destColor}; 
            color: white; 
            border-radius: 12px;
            font-weight: 500;
          ">
            ${status.toUpperCase()}
          </span>
        </div>
      </div>
    `);

    // Draw route line if origin exists and status is shipped
    if (origin && ['shipped', 'delivered'].includes(status)) {
      const routeLine = L.polyline(
        [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]],
        {
          color: status === 'delivered' ? '#10b981' : '#f59e0b',
          weight: 3,
          opacity: 0.7,
          dashArray: status === 'delivered' ? undefined : '10, 10',
        }
      ).addTo(map);

      // Fit bounds to show both markers
      const bounds = L.latLngBounds([
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Just center on destination
      map.setView([destCoords.lat, destCoords.lng], 12);
    }
  }, [origin, destination, status]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height, width: '100%', borderRadius: '8px' }}
      className="z-0 border border-border"
    />
  );
}
