'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

// @strapi/utils is a Strapi runtime dep — not installed in the bare test env.
// Inject a minimal stub into require.cache before loading the lifecycle.
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}

const UTILS_MOCK_ID = '__strapi_utils_mock__';
require.cache[UTILS_MOCK_ID] = {
  id: UTILS_MOCK_ID, filename: UTILS_MOCK_ID, loaded: true,
  exports: { errors: { ValidationError } },
};

const _origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === '@strapi/utils') return UTILS_MOCK_ID;
  return _origResolve.call(this, request, parent, isMain, options);
};

const LIFECYCLE_PATH = path.resolve(
  __dirname,
  '../../src/api/transporter/content-types/transporter/lifecycles.js'
);

const hooks = require(LIFECYCLE_PATH);

function makeEvent(contactChannels) {
  return { params: { data: { contactChannels } } };
}

// --- structural validation (no strapi global — uses FALLBACK_CHANNELS) ------

test('beforeCreate accepts valid contact channels', async () => {
  await assert.doesNotReject(() => hooks.beforeCreate(makeEvent([
    { number: '+352621123456', channels: ['phone', 'whatsapp'] },
  ])));
  await assert.doesNotReject(() => hooks.beforeCreate(makeEvent([
    { number: '+352 621 123 456', channels: ['viber'] },
    { number: '0040721123456', channels: ['phone'] },
  ])));
});

test('beforeCreate rejects number missing + or 00 prefix', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent([{ number: '352621123456', channels: ['phone'] }])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects non-string number', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent([{ number: 352621123456, channels: ['phone'] }])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects invalid channel slug (fallback set)', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent([{ number: '+352621123456', channels: ['telegram'] }])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects empty channels array', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent([{ number: '+352621123456', channels: [] }])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects non-array contactChannels', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent({ number: '+352621123456', channels: ['phone'] })),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects non-object entry', async () => {
  await assert.rejects(
    () => hooks.beforeCreate(makeEvent(['+352621123456'])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate skips validation when contactChannels is absent', async () => {
  await assert.doesNotReject(() => hooks.beforeCreate(makeEvent(undefined)));
});

test('beforeUpdate accepts valid contact channels', async () => {
  await assert.doesNotReject(() => hooks.beforeUpdate(makeEvent([
    { number: '+33612345678', channels: ['whatsapp', 'viber'] },
  ])));
});

test('beforeUpdate rejects invalid phone number', async () => {
  await assert.rejects(
    () => hooks.beforeUpdate(makeEvent([{ number: 'notaphone', channels: ['phone'] }])),
    { name: 'ValidationError' }
  );
});

// --- DB-backed channel validation (mocked strapi global) --------------------

test('beforeCreate rejects slug absent from DB', async () => {
  global.strapi = {
    documents: () => ({
      findMany: async () => [{ slug: 'whatsapp' }, { slug: 'phone' }],
    }),
  };
  try {
    await assert.rejects(
      () => hooks.beforeCreate(makeEvent([{ number: '+352621123456', channels: ['viber'] }])),
      { name: 'ValidationError' }
    );
  } finally {
    delete global.strapi;
  }
});

test('beforeCreate accepts slug present in DB', async () => {
  global.strapi = {
    documents: () => ({
      findMany: async () => [{ slug: 'signal' }, { slug: 'phone' }],
    }),
  };
  try {
    await assert.doesNotReject(
      () => hooks.beforeCreate(makeEvent([{ number: '+352621123456', channels: ['signal'] }]))
    );
  } finally {
    delete global.strapi;
  }
});
