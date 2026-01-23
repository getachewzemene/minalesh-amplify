'use client'

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fixLeafletIcons } from '@/lib/leaflet-config';

interface CourierLocation {
  latitude: number;
  longitude: number;
  timestamp: Date | string;
  accuracy?: number;
}

interface WarehouseInfo {
  name: string;
  city: string;
  lat: number;
  lng: number;
}

interface CourierTrackingMapProps {
  warehouse: WarehouseInfo;
  destination: { 
    city: string; 
    fullAddress: string;
    lat: number; 
    lng: number;
  };
  courierLocation?: CourierLocation | null;
  locationHistory?: CourierLocation[];
  courierInfo?: {
    name?: string;
    phone?: string;
    photoUrl?: string;
    vehicleInfo?: string;
  };
  trafficConditions?: {
    level: 'low' | 'moderate' | 'heavy' | 'severe';
    delayMinutes: number;
  };
  estimatedArrival?: Date | string;
  height?: string;
  enableRealTimeUpdates?: boolean;
  onRequestLocationUpdate?: () => void;
}

export default function CourierTrackingMap({ 
  warehouse,
  destination,
  courierLocation,
  locationHistory = [],
  courierInfo,
  trafficConditions,
  estimatedArrival,
  height = '450px',
  enableRealTimeUpdates = false,
  onRequestLocationUpdate,
}: CourierTrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const historyLineRef = useRef<L.Polyline | null>(null);

  // Real-time update polling
  useEffect(() => {
    if (!enableRealTimeUpdates || !onRequestLocationUpdate) return;

    const interval = setInterval(() => {
      onRequestLocationUpdate();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, onRequestLocationUpdate]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    fixLeafletIcons();

    // Initialize map centered between warehouse and destination
    const centerLat = (warehouse.lat + destination.lat) / 2;
    const centerLng = (warehouse.lng + destination.lng) / 2;

    const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 12);
    mapRef.current = map;

    // Add OpenStreetMap tile layer (default)
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

  // Update markers and routes
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing route and history lines
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (historyLineRef.current) {
      map.removeLayer(historyLineRef.current);
      historyLineRef.current = null;
    }

    // Create custom icons
    const createIcon = (color: string, label: string, size: number = 32) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color}; 
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: ${Math.floor(size / 2.5)}px;
            ">${label}</span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
      });
    };

    // Add warehouse marker
    const warehouseMarker = L.marker([warehouse.lat, warehouse.lng], {
      icon: createIcon('#3b82f6', 'W'),
    }).addTo(map);

    warehouseMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 180px;">
        <strong style="font-size: 14px; color: #3b82f6;">📦 ${warehouse.name}</strong>
        <div style="margin-top: 4px; font-size: 12px; color: #666;">
          ${warehouse.city}
        </div>
      </div>
    `);

    // Add destination marker
    const destMarker = L.marker([destination.lat, destination.lng], {
      icon: createIcon('#10b981', '🏠'),
    }).addTo(map);

    destMarker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 180px;">
        <strong style="font-size: 14px; color: #10b981;">Delivery Address</strong>
        <div style="margin-top: 4px; font-size: 12px; color: #666;">
          ${destination.fullAddress}<br/>
          ${destination.city}
        </div>
        ${estimatedArrival ? `
          <div style="margin-top: 6px; font-size: 11px; padding: 4px 8px; background: #f0fdf4; border-radius: 4px;">
            <strong>ETA:</strong> ${new Date(estimatedArrival).toLocaleTimeString()}
          </div>
        ` : ''}
      </div>
    `);

    // Add courier marker if location available
    if (courierLocation) {
      const courierIcon = L.divIcon({
        className: 'courier-marker',
        html: `
          <div style="position: relative;">
            <div style="
              background-color: #f59e0b; 
              width: 40px; 
              height: 40px; 
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 3px 10px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">
              <span style="font-size: 20px;">🚗</span>
            </div>
            ${courierLocation.accuracy ? `
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${courierLocation.accuracy * 2}px;
                height: ${courierLocation.accuracy * 2}px;
                border-radius: 50%;
                background: rgba(245, 158, 11, 0.2);
                border: 2px solid rgba(245, 158, 11, 0.5);
              "></div>
            ` : ''}
          </div>
          <style>
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });

      if (courierMarkerRef.current) {
        map.removeLayer(courierMarkerRef.current);
      }

      courierMarkerRef.current = L.marker(
        [courierLocation.latitude, courierLocation.longitude],
        { icon: courierIcon }
      ).addTo(map);

      const courierPopupContent = `
        <div style="font-family: sans-serif; min-width: 200px;">
          <strong style="font-size: 14px; color: #f59e0b;">🚗 Courier Location</strong>
          ${courierInfo?.name ? `<div style="margin-top: 6px; font-size: 12px;"><strong>${courierInfo.name}</strong></div>` : ''}
          ${courierInfo?.vehicleInfo ? `<div style="font-size: 11px; color: #666;">${courierInfo.vehicleInfo}</div>` : ''}
          ${courierInfo?.phone ? `<div style="font-size: 11px; margin-top: 4px;">📞 ${courierInfo.phone}</div>` : ''}
          <div style="margin-top: 6px; font-size: 10px; color: #999;">
            Last updated: ${new Date(courierLocation.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `;

      courierMarkerRef.current.bindPopup(courierPopupContent);
    }

    // Draw location history trail
    if (locationHistory.length > 0) {
      const historyCoords = locationHistory.map(loc => [loc.latitude, loc.longitude] as [number, number]);
      
      historyLineRef.current = L.polyline(historyCoords, {
        color: '#fbbf24',
        weight: 3,
        opacity: 0.6,
        dashArray: '5, 10',
      }).addTo(map);
    }

    // Draw route from current location (or warehouse) to destination
    const routeStart = courierLocation 
      ? [courierLocation.latitude, courierLocation.longitude] as [number, number]
      : [warehouse.lat, warehouse.lng] as [number, number];
    
    const routeColor = trafficConditions 
      ? (trafficConditions.level === 'heavy' || trafficConditions.level === 'severe' ? '#ef4444' : '#10b981')
      : '#10b981';

    routeLineRef.current = L.polyline(
      [routeStart, [destination.lat, destination.lng]],
      {
        color: routeColor,
        weight: 4,
        opacity: 0.7,
      }
    ).addTo(map);

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([
      [warehouse.lat, warehouse.lng],
      [destination.lat, destination.lng],
      ...(courierLocation ? [[courierLocation.latitude, courierLocation.longitude]] : []),
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [warehouse, destination, courierLocation, locationHistory, courierInfo, trafficConditions, estimatedArrival]);

  return (
    <div className="relative">
      {trafficConditions && trafficConditions.delayMinutes > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚦</span>
            <div>
              <div className="font-semibold text-sm">Traffic Alert</div>
              <div className="text-xs text-gray-600">
                {trafficConditions.level === 'severe' ? 'Heavy traffic' : 
                 trafficConditions.level === 'heavy' ? 'Moderate traffic' : 'Light traffic'} - 
                {' '}{trafficConditions.delayMinutes} min delay
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%', borderRadius: '8px' }}
        className="z-0 border border-border"
      />
      
      {courierLocation && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Last GPS update: {new Date(courierLocation.timestamp).toLocaleString()}
          {enableRealTimeUpdates && ' • Updates every 10 seconds'}
        </div>
      )}
    </div>
  );
}
