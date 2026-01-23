# Real-time Courier GPS Tracking Features

## Overview
This implementation provides comprehensive real-time courier GPS tracking with multiple warehouse origins, traffic-based delivery estimates, 3D terrain visualization, and custom map styles/themes.

## Features Implemented

### 1. Multiple Warehouse Origins ✅

#### Database Schema
- **Warehouse Model**: Complete schema with GPS coordinates, operating hours, capacity
- **Order Integration**: Orders can be linked to specific warehouses
- **Migration**: SQL migration file for database updates

#### Warehouse Management
- **API Endpoints**:
  - `GET /api/warehouses` - List all warehouses with filtering
  - `POST /api/warehouses` - Create new warehouse (admin only)
  - `GET /api/warehouses/[id]` - Get specific warehouse
  - `PATCH /api/warehouses/[id]` - Update warehouse (admin only)
  - `DELETE /api/warehouses/[id]` - Delete warehouse (admin only)

#### Warehouse Selection
- **Smart Routing**: Automatically selects nearest warehouse to delivery location
- **Capacity Aware**: Considers warehouse capacity when selecting
- **Fallback Logic**: Primary warehouse used as fallback
- **Distance Calculation**: Haversine formula for accurate distance measurement

#### Seed Data
6 warehouses pre-configured across Ethiopian cities:
- Addis Ababa Central (Primary)
- Addis Ababa Merkato
- Dire Dawa
- Hawassa
- Bahir Dar
- Mekelle

### 2. Real-time GPS Tracking ✅

#### CourierTrackingMap Component
**Features**:
- Live courier location with animated marker
- Location history trail visualization
- 10-second auto-refresh polling
- Accuracy indicator (GPS accuracy radius)
- Last update timestamp display
- Courier information popup (name, phone, vehicle)

**Usage**:
```tsx
import { CourierTrackingMap } from '@/components/maps';

<CourierTrackingMap
  warehouse={{
    name: "Addis Ababa Central",
    city: "Addis Ababa",
    lat: 9.0192,
    lng: 38.7525
  }}
  destination={{
    city: "Addis Ababa",
    fullAddress: "123 Bole Road",
    lat: 9.0320,
    lng: 38.7469
  }}
  courierLocation={{
    latitude: 9.025,
    longitude: 38.750,
    timestamp: new Date(),
    accuracy: 10
  }}
  courierInfo={{
    name: "John Doe",
    phone: "+251911234567",
    vehicleInfo: "Blue motorcycle, ABC123"
  }}
  enableRealTimeUpdates={true}
  onRequestLocationUpdate={() => fetchLatestLocation()}
/>
```

#### Database Fields
Enhanced `DeliveryTracking` model with:
- `currentLatitude` / `currentLongitude`
- `lastLocationUpdate`
- `locationHistory` (JSON array, stores last 100 points)
- `routeData` (route geometry)
- `trafficConditions` (traffic API data)

### 3. Traffic-based Delivery Estimates ✅

#### Traffic Integration
**Current Implementation**:
- Time-of-day based traffic estimation
- Peak hours detection (7-9 AM, 5-7 PM)
- Traffic factor multiplier (1.0 - 2.0)

**Traffic Levels**:
- `low`: No delay, factor 1.0
- `moderate`: +10 min delay, factor 1.3
- `heavy`: +20 min delay, factor 1.8
- `severe`: +30 min delay, factor 2.0+

**Ready for API Integration**:
The `getTrafficLevel()` function in `warehouse-routing.ts` is structured to integrate with:
- Google Maps Directions API
- Mapbox Directions API
- HERE Traffic API

**Visual Indicators**:
- Route lines change color based on traffic (red = heavy, orange = moderate, green = clear)
- Traffic alert banner shows delay estimates
- ETA adjusts dynamically based on traffic conditions

### 4. 3D Terrain Visualization ✅

#### Terrain3DMap Component
**Powered by Mapbox GL JS**

**Features**:
- 3D terrain with elevation data
- 3D building visualization
- Atmospheric sky layer
- Interactive camera controls
- Elevation profiles for routes

**Requirements**:
- Set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` environment variable
- Free tier: 50,000 requests/month
- Get token at: https://account.mapbox.com/access-tokens/

**Usage**:
```tsx
import { Terrain3DMap } from '@/components/maps';

<Terrain3DMap
  warehouse={{
    name: "Addis Ababa Central",
    lat: 9.0192,
    lng: 38.7525,
    elevation: 2355
  }}
  destination={{
    address: "123 Bole Road",
    city: "Addis Ababa",
    lat: 9.0320,
    lng: 38.7469,
    elevation: 2400
  }}
  courierLocation={{
    lat: 9.025,
    lng: 38.750,
    elevation: 2380
  }}
  enableTerrain={true}
  enable3DBuildings={true}
  mapStyle="outdoors"
/>
```

**Map Styles Available**:
- `streets` - Standard street map
- `satellite` - Satellite imagery with roads
- `outdoors` - Terrain-focused for hiking/delivery
- `dark` - Dark theme
- `light` - Light/minimal theme

**Controls**:
- Right-click + drag to rotate
- Ctrl + drag to adjust pitch
- Scroll to zoom
- Navigation controls (top-right)
- Fullscreen mode

### 5. Custom Map Styles/Themes ✅

#### DeliveryTrackingMap Enhancements
**Theme Support**:
- `default`: OpenStreetMap standard tiles
- `dark`: CartoDB dark theme
- `satellite`: Esri World Imagery

**Usage**:
```tsx
<DeliveryTrackingMap
  origin={{
    city: "Addis Ababa",
    name: "AA Central Warehouse",
    lat: 9.0192,
    lng: 38.7525
  }}
  destination={{
    city: "Addis Ababa",
    fullAddress: "123 Bole Road",
    lat: 9.0320,
    lng: 38.7469
  }}
  status="in_transit"
  theme="dark"
  showTraffic={true}
  trafficLevel="moderate"
  estimatedDistance={5.2}
  height="400px"
/>
```

## API Reference

### Warehouse Endpoints

#### GET /api/warehouses
List all warehouses.

**Query Parameters**:
- `city` - Filter by city
- `isActive` - Filter by active status (true/false)
- `isPrimary` - Filter primary warehouse (true/false)

**Response**:
```json
{
  "success": true,
  "warehouses": [...],
  "count": 6
}
```

#### POST /api/warehouses (Admin Only)
Create a new warehouse.

**Request Body**:
```json
{
  "name": "Warehouse Name",
  "code": "WH-01",
  "address": "123 Street",
  "city": "Addis Ababa",
  "region": "Addis Ababa",
  "latitude": 9.0192,
  "longitude": 38.7525,
  "phone": "+251911234567",
  "email": "warehouse@example.com",
  "managerName": "Manager Name",
  "capacity": 10000,
  "operatingHours": {
    "monday": {"open": "08:00", "close": "18:00"}
  },
  "isActive": true,
  "isPrimary": false
}
```

#### GET /api/warehouses/[id]
Get specific warehouse with order count.

#### PATCH /api/warehouses/[id] (Admin Only)
Update warehouse details.

#### DELETE /api/warehouses/[id] (Admin Only)
Delete warehouse (only if no orders).

### Warehouse Routing Utilities

#### findNearestWarehouse(location, options)
Find the closest warehouse to a delivery location.

```typescript
const nearest = await findNearestWarehouse(
  { lat: 9.0320, lng: 38.7469 },
  { city: "Addis Ababa" }
);
```

#### selectWarehouseForOrder(location, options)
Intelligently select optimal warehouse considering distance and capacity.

```typescript
const warehouse = await selectWarehouseForOrder(
  { lat: 9.0320, lng: 38.7469 },
  { preferredCity: "Addis Ababa", requiredCapacity: 100 }
);
```

#### calculateRouteInfo(warehouseId, destination)
Calculate complete route information including traffic.

```typescript
const route = await calculateRouteInfo(
  warehouseId,
  { lat: 9.0320, lng: 38.7469 }
);
// Returns: { warehouse, distance, estimatedTime, traffic }
```

## Database Schema Updates

### Warehouse Table
```sql
CREATE TABLE "warehouses" (
  "id" UUID PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "latitude" DECIMAL(10,8) NOT NULL,
  "longitude" DECIMAL(11,8) NOT NULL,
  "phone" TEXT,
  "email" TEXT,
  "manager_name" TEXT,
  "capacity" INTEGER,
  "operating_hours" JSONB DEFAULT '{}',
  "is_active" BOOLEAN DEFAULT true,
  "is_primary" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);
```

### DeliveryTracking Updates
```sql
ALTER TABLE "delivery_tracking" 
  ADD COLUMN "route_data" JSONB,
  ADD COLUMN "traffic_conditions" JSONB,
  ADD COLUMN "estimated_distance_km" DECIMAL(8,2),
  ADD COLUMN "estimated_duration_min" INTEGER,
  ADD COLUMN "traffic_delay_min" INTEGER DEFAULT 0,
  ADD COLUMN "last_route_update" TIMESTAMP;
```

### Order Table Update
```sql
ALTER TABLE "orders" ADD COLUMN "warehouse_id" UUID;
```

## Environment Variables

Add to `.env`:

```env
# Optional: Mapbox for 3D maps and advanced routing
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here

# Optional: Google Maps API for traffic data (future enhancement)
GOOGLE_MAPS_API_KEY=your_key_here

# Optional: HERE Maps API for traffic (alternative)
HERE_API_KEY=your_key_here
```

## Testing

Run GPS tracking tests:
```bash
npm test src/__tests__/gps-tracking-features.test.ts
```

Test coverage:
- ✅ Distance calculation (Haversine formula)
- ✅ Delivery time estimation
- ✅ Traffic factor application
- ✅ Data structure validation
- ✅ Map component props

## Next Steps / Future Enhancements

### High Priority
1. **Real Traffic API Integration**
   - Integrate Google Maps Directions API or Mapbox Directions
   - Replace mock traffic data with live traffic
   - Add route optimization for multiple stops

2. **WebSocket for Real-time Updates**
   - Replace polling with WebSocket connections
   - Reduce server load and improve responsiveness
   - Push notifications for location updates

3. **Route Optimization**
   - Multi-stop route planning
   - Time window optimization
   - Load balancing across warehouses

### Medium Priority
4. **Advanced Analytics**
   - Delivery time accuracy metrics
   - Warehouse performance comparison
   - Traffic pattern analysis

5. **Mobile App Support**
   - Native maps for iOS/Android
   - Background location tracking
   - Offline map support

6. **Customer Features**
   - Share live tracking link
   - ETA notifications
   - Route preview before ordering

### Low Priority
7. **Advanced Visualizations**
   - Heatmaps of delivery density
   - Historical route playback
   - Warehouse coverage radius

8. **Integration Features**
   - Third-party courier API integration
   - Automated dispatch systems
   - Route export (GPX/KML)

## Architecture Decisions

### Why Leaflet + Mapbox GL?
- **Leaflet**: Lightweight, free, works offline, no API keys for basic features
- **Mapbox GL**: Advanced 3D, best terrain data, smooth performance
- Both: Flexibility to choose based on use case and budget

### Traffic Data Approach
- Mock data for MVP (time-based estimation)
- API integration ready (just uncomment and add keys)
- Allows testing without API costs during development

### Warehouse Selection Logic
1. Check preferred city first
2. Fall back to nearest warehouse
3. Consider capacity constraints
4. Final fallback to primary warehouse

This ensures reliability while optimizing for delivery efficiency.

## Performance Considerations

### Map Loading
- Lazy load map components
- Cache tile data where possible
- Use CDN for map assets

### GPS Updates
- 10-second polling interval (configurable)
- Throttle location history (max 100 points)
- Debounce map re-renders

### API Optimization
- Index warehouse queries by city
- Cache nearest warehouse calculations
- Batch traffic API requests

## Security Notes

- Warehouse management APIs require admin authentication
- GPS tracking APIs validate order ownership
- API keys stored in environment variables (never committed)
- Rate limiting recommended for public endpoints

## Migration Guide

To apply database changes:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

To seed warehouses:

```typescript
import { WAREHOUSE_SEED_DATA } from '@/lib/warehouse-seed-data';
import prisma from '@/lib/prisma';

for (const warehouse of WAREHOUSE_SEED_DATA) {
  await prisma.warehouse.create({ data: warehouse });
}
```

## Support

For questions or issues:
1. Check test files for usage examples
2. Review component props in TypeScript definitions
3. See LEAFLET_IMPLEMENTATION.md for additional map details
