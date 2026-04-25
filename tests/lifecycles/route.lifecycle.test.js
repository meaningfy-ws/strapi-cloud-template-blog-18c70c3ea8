'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const LIFECYCLE_PATH = path.resolve(
  __dirname,
  '../../src/api/route/content-types/route/lifecycles.js'
);

global.strapi = { log: { warn: () => {} } };

function makeFetchMock(features) {
  return async () => ({
    json: async () => ({ features }),
  });
}

function coordFeature(lon, lat) {
  return { geometry: { coordinates: [lon, lat] } };
}

test('beforeCreate sets geoJson LineString when all cities geocode', async () => {
  global.fetch = makeFetchMock([coordFeature(6.13, 49.61)]);
  delete require.cache[LIFECYCLE_PATH];
  const hooks = require(LIFECYCLE_PATH);

  const event = { params: { data: { citiesText: 'Luxembourg, Chisinau' } } };
  await hooks.beforeCreate(event);

  const geo = event.params.data.geoJson;
  assert.ok(geo, 'geoJson should be set');
  assert.strictEqual(geo.type, 'LineString');
  assert.ok(Array.isArray(geo.coordinates));
  assert.strictEqual(geo.coordinates.length, 2);
  assert.deepStrictEqual(geo.coordinates[0], [6.13, 49.61]);
});

test('beforeCreate does not set geoJson when fewer than 2 cities geocode', async () => {
  global.fetch = makeFetchMock([]);
  delete require.cache[LIFECYCLE_PATH];
  const hooks = require(LIFECYCLE_PATH);

  const event = { params: { data: { citiesText: 'UnknownCityXYZ, AnotherUnknown' } } };
  await hooks.beforeCreate(event);

  assert.strictEqual(event.params.data.geoJson, undefined);
});

test('beforeCreate skips geocoding when citiesText is absent', async () => {
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return { json: async () => ({}) }; };
  delete require.cache[LIFECYCLE_PATH];
  const hooks = require(LIFECYCLE_PATH);

  const event = { params: { data: {} } };
  await hooks.beforeCreate(event);

  assert.strictEqual(fetchCalled, false);
  assert.strictEqual(event.params.data.geoJson, undefined);
});

test('beforeUpdate sets geoJson when citiesText is provided', async () => {
  global.fetch = makeFetchMock([coordFeature(2.35, 48.85)]);
  delete require.cache[LIFECYCLE_PATH];
  const hooks = require(LIFECYCLE_PATH);

  const event = { params: { data: { citiesText: 'Paris, Lyon' } } };
  await hooks.beforeUpdate(event);

  const geo = event.params.data.geoJson;
  assert.ok(geo, 'geoJson should be set');
  assert.strictEqual(geo.type, 'LineString');
});

test('beforeUpdate skips geocoding when citiesText is absent', async () => {
  let fetchCalled = false;
  global.fetch = async () => { fetchCalled = true; return { json: async () => ({}) }; };
  delete require.cache[LIFECYCLE_PATH];
  const hooks = require(LIFECYCLE_PATH);

  const event = { params: { data: { name: 'Updated name only' } } };
  await hooks.beforeUpdate(event);

  assert.strictEqual(fetchCalled, false);
});
