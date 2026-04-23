'use strict';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_DELAY_MS = 1100; // Nominatim rate limit: max 1 req/sec

async function geocodeCity(city) {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'hulubul.com/1.0 (contact@hulubul.com)' },
  });
  const results = await response.json();
  if (!results.length) return null;
  return [parseFloat(results[0].lon), parseFloat(results[0].lat)];
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
    // Respect Nominatim's 1 req/sec policy
    await new Promise(resolve => setTimeout(resolve, NOMINATIM_DELAY_MS));
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
