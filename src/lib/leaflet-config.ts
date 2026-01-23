/**
 * Leaflet Map Configuration Utility
 * Fixes icon loading issues in Next.js and provides consistent map setup
 */

import L from 'leaflet';

/**
 * Fix for default marker icons in Leaflet with Next.js
 * Uses CDN URLs as Leaflet's bundled images don't work with Next.js webpack
 * These URLs point to the official Leaflet CDN (reliable and cached)
 */
export function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

