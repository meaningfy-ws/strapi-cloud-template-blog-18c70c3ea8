'use strict';

const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || 'https://photon.komoot.io';
const GEO_SERVICE_TOKEN = process.env.GEO_SERVICE_TOKEN || null;
const SUGGEST_LIMIT = 5;

function buildHeaders() {
  const headers = { 'User-Agent': 'hulubul.com/1.0 (contact@hulubul.com)' };
  if (GEO_SERVICE_TOKEN) headers['Authorization'] = `Bearer ${GEO_SERVICE_TOKEN}`;
  return headers;
}

async function geocodeCity(city) {
  const url = `${GEO_SERVICE_URL}/api/?q=${encodeURIComponent(city)}&limit=1&lang=en`;
  const response = await fetch(url, { headers: buildHeaders() });
  const data = await response.json();
  if (!data.features?.length) return null;
  return data.features[0].geometry.coordinates;
}

async function buildGeoJson(citiesText) {
  const cities = citiesText.split(',').map(c => c.trim()).filter(Boolean);
  const coordinates = [];

  for (const city of cities) {
    try {
      const coord = await geocodeCity(city);
      if (coord) coordinates.push(coord);
      else strapi.log.warn(`[route/geocode] No result for city: "${city}"`);
    } catch (err) {
      strapi.log.warn(`[route/geocode] Failed for city: "${city}"`, err.message);
    }
  }

  if (coordinates.length < 2) return null;
  return { type: 'LineString', coordinates };
}

async function fetchSuggestions(q) {
  const url = `${GEO_SERVICE_URL}/api/?q=${encodeURIComponent(q)}&limit=${SUGGEST_LIMIT}&lang=en`;
  const response = await fetch(url, { headers: buildHeaders() });
  const data = await response.json();

  return (data.features || []).map(f => ({
    name: [f.properties?.name, f.properties?.state, f.properties?.country]
      .filter(Boolean)
      .join(', '),
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}

module.exports = { geocodeCity, buildGeoJson, fetchSuggestions };
