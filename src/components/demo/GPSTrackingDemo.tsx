/**
 * GPS Tracking Demo/Example Component
 * Demonstrates all GPS tracking features
 */

'use client'

import { useState } from 'react';
import { CourierTrackingMap, Terrain3DMap, DeliveryTrackingMap } from '@/components/maps';

export default function GPSTrackingDemo() {
  const [selectedMap, setSelectedMap] = useState<'2d' | 'courier' | '3d'>('courier');
  const [theme, setTheme] = useState<'default' | 'dark' | 'satellite'>('default');

  // Demo data
  const warehouse = {
    name: 'Addis Ababa Central Warehouse',
    city: 'Addis Ababa',
    lat: 9.0192,
    lng: 38.7525,
    elevation: 2355,
  };

  const destination = {
    city: 'Addis Ababa',
    fullAddress: '123 Bole Road, near Edna Mall, Addis Ababa',
    address: '123 Bole Road, near Edna Mall',
    lat: 9.0320,
    lng: 38.7469,
    elevation: 2400,
  };

  const courierLocation = {
    latitude: 9.025,
    longitude: 38.750,
    timestamp: new Date(),
    accuracy: 10,
    elevation: 2380,
  };

  const courierInfo = {
    name: 'Abebe Kebede',
    phone: '+251911234567',
    photoUrl: '/courier-photo.jpg',
    vehicleInfo: 'Blue motorcycle, Plate: AA-12345',
  };

  const locationHistory = [
    { latitude: 9.0192, longitude: 38.7525, timestamp: new Date(Date.now() - 600000) },
    { latitude: 9.021, longitude: 38.749, timestamp: new Date(Date.now() - 480000) },
    { latitude: 9.023, longitude: 38.751, timestamp: new Date(Date.now() - 360000) },
    { latitude: 9.025, longitude: 38.750, timestamp: new Date(Date.now() - 240000) },
  ];

  const trafficConditions = {
    level: 'moderate' as const,
    delayMinutes: 10,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">📍 Real-time GPS Tracking</h1>
        <p className="text-gray-600">
          Live courier tracking with multiple warehouses, traffic estimates, and 3D visualization
        </p>
      </div>

      {/* Map Selection */}
      <div className="flex gap-4 items-center justify-center">
        <button
          onClick={() => setSelectedMap('2d')}
          className={`px-4 py-2 rounded-lg ${selectedMap === '2d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          📍 Basic 2D Map
        </button>
        <button
          onClick={() => setSelectedMap('courier')}
          className={`px-4 py-2 rounded-lg ${selectedMap === 'courier' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          🚗 Live Courier Tracking
        </button>
        <button
          onClick={() => setSelectedMap('3d')}
          className={`px-4 py-2 rounded-lg ${selectedMap === '3d' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          🏔️ 3D Terrain
        </button>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'default' | 'dark' | 'satellite')}
          className="px-3 py-2 border rounded-md"
        >
          <option value="default">Default Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="satellite">Satellite</option>
        </select>
      </div>

      {/* Map Display */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {selectedMap === '2d' && (
          <DeliveryTrackingMap
            origin={{
              city: warehouse.city,
              name: warehouse.name,
              lat: warehouse.lat,
              lng: warehouse.lng,
            }}
            destination={destination}
            status="in_transit"
            theme={theme}
            showTraffic={true}
            trafficLevel="moderate"
            estimatedDistance={5.2}
            height="500px"
          />
        )}

        {selectedMap === 'courier' && (
          <CourierTrackingMap
            warehouse={warehouse}
            destination={destination}
            courierLocation={courierLocation}
            locationHistory={locationHistory}
            courierInfo={courierInfo}
            trafficConditions={trafficConditions}
            estimatedArrival={new Date(Date.now() + 900000)}
            height="500px"
            enableRealTimeUpdates={false}
          />
        )}

        {selectedMap === '3d' && (
          <Terrain3DMap
            warehouse={warehouse}
            destination={destination}
            courierLocation={{
              lat: courierLocation.latitude,
              lng: courierLocation.longitude,
              elevation: courierLocation.elevation,
            }}
            enableTerrain={true}
            enable3DBuildings={true}
            mapStyle="outdoors"
            height="500px"
          />
        )}
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📦 Delivery Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Origin:</span>
              <span className="font-semibold">{warehouse.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-semibold">5.2 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Traffic Delay:</span>
              <span className="font-semibold text-orange-600">+10 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚗 Courier Info</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-semibold">{courierInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-semibold">{courierInfo.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-semibold">{courierInfo.vehicleInfo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
