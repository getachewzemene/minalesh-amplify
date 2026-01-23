/**
 * Ethiopian Cities Coordinates Database
 * Shared constants for mapping components
 */

export interface CityCoordinates {
  lat: number;
  lng: number;
}

export const ETHIOPIAN_CITIES: Record<string, CityCoordinates> = {
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

// Default warehouse location (Addis Ababa)
export const DEFAULT_WAREHOUSE_LOCATION: CityCoordinates = {
  lat: 9.0320,
  lng: 38.7469,
};

// Ethiopia map center and default zoom
export const ETHIOPIA_MAP_CENTER: CityCoordinates = {
  lat: 9.145,
  lng: 40.489673,
};

export const ETHIOPIA_DEFAULT_ZOOM = 6;
