'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const GEOCODE_PATH = path.resolve(__dirname, '../../src/api/route/utils/geocode.js');

// buildGeoJson uses strapi.log.warn — provide a minimal global stub
global.strapi = { log: { warn: () => {} } };

function makePhotonResponse(features) {
  return async () => ({ json: async () => ({ features }) });
}

function cityFeature(name, state, country, lon, lat) {
  return {
    geometry: { coordinates: [lon, lat] },
    properties: { name, state, country },
  };
}

test('fetchSuggestions returns shaped suggestions from Photon features', async () => {
  global.fetch = makePhotonResponse([
    cityFeature('Luxembourg', 'Luxembourg', 'Luxembourg', 6.1296, 49.6116),
    cityFeature('Luxembourg', 'Moselle', 'France', 6.1354, 49.4833),
  ]);
  delete require.cache[GEOCODE_PATH];
  const { fetchSuggestions } = require(GEOCODE_PATH);

  const results = await fetchSuggestions('Luxem');

  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].name, 'Luxembourg, Luxembourg, Luxembourg');
  assert.strictEqual(results[0].lon, 6.1296);
  assert.strictEqual(results[0].lat, 49.6116);
  assert.strictEqual(results[1].name, 'Luxembourg, Moselle, France');
});

test('fetchSuggestions returns empty array when Photon has no features', async () => {
  global.fetch = makePhotonResponse([]);
  delete require.cache[GEOCODE_PATH];
  const { fetchSuggestions } = require(GEOCODE_PATH);

  const results = await fetchSuggestions('zzz');

  assert.deepStrictEqual(results, []);
});

test('fetchSuggestions omits undefined name/state/country parts', async () => {
  global.fetch = makePhotonResponse([
    { geometry: { coordinates: [2.35, 48.85] }, properties: { name: 'Paris', country: 'France' } },
  ]);
  delete require.cache[GEOCODE_PATH];
  const { fetchSuggestions } = require(GEOCODE_PATH);

  const results = await fetchSuggestions('Par');

  assert.strictEqual(results[0].name, 'Paris, France');
});

test('buildGeoJson builds LineString from two geocoded cities', async () => {
  global.fetch = makePhotonResponse([cityFeature('X', 'Y', 'Z', 6.13, 49.61)]);
  delete require.cache[GEOCODE_PATH];
  const { buildGeoJson } = require(GEOCODE_PATH);

  const result = await buildGeoJson('Luxembourg, Chisinau');

  assert.ok(result);
  assert.strictEqual(result.type, 'LineString');
  assert.strictEqual(result.coordinates.length, 2);
});

test('buildGeoJson returns null when fewer than 2 cities resolve', async () => {
  global.fetch = makePhotonResponse([]);
  delete require.cache[GEOCODE_PATH];
  const { buildGeoJson } = require(GEOCODE_PATH);

  const result = await buildGeoJson('UnknownA, UnknownB');

  assert.strictEqual(result, null);
});
