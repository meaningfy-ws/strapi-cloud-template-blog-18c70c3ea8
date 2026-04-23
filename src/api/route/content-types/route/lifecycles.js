'use strict';

const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'https://photon.komoot.io';
const GEO_SERVICE_TOKEN = process.env.GEO_SERVICE_TOKEN || null;

async function geocodeCity(city) {
  const url = `${GEO_SERVICE_URL}/api/?q=${encodeURIComponent(city)}&limit=1&lang=en`;
  const headers = { 'User-Agent': 'hulubul.com/1.0 (contact@hulubul.com)' };
  if (GEO_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${GEO_SERVICE_TOKEN}`;

  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!data.features?.length) return null;
  // Photon returns GeoJSON: coordinates are [lon, lat]
  return data.features[0].geometry.coordinates;
}

async function buildGeoJson(citiesText) {
  const cities = citiesText.split(',').map(c => c.trim()).filter(Boolean);
  const coordinates = [];

  for (const city of cities) {
    try {
      const coord = await geocodeCity(city);
      if (coord) coordinates.push(coord);
      else strapi.log.warn(`[route/lifecycles] No geocode result for city: "${city}"`);
    } catch (err) {
      strapi.log.warn(`[route/lifecycles] Geocoding failed for city: "${city}"`, err.message);
    }
  }

  if (coordinates.length < 2) return null;
  return { type: 'LineString', coordinates };
}

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    if (!data.citiesText) return;
    const geoJson = await buildGeoJson(data.citiesText);
    if (geoJson) data.geoJson = geoJson;
    else strapi.log.warn('[route/lifecycles] GeoJSON not set — fewer than 2 cities geocoded successfully.');
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    if (!data.citiesText) return;
    const geoJson = await buildGeoJson(data.citiesText);
    if (geoJson) data.geoJson = geoJson;
    else strapi.log.warn('[route/lifecycles] GeoJSON not set — fewer than 2 cities geocoded successfully.');
  },
};
