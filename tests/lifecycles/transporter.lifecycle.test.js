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

function makeEvent(phoneNumbers) {
  return { params: { data: { phoneNumbers } } };
}

test('beforeCreate accepts valid international phone numbers', () => {
  assert.doesNotThrow(() => hooks.beforeCreate(makeEvent(['+352621123456', '+37369123456'])));
  assert.doesNotThrow(() => hooks.beforeCreate(makeEvent(['+352 621 123 456'])));
  assert.doesNotThrow(() => hooks.beforeCreate(makeEvent(['0040721123456'])));
  assert.doesNotThrow(() => hooks.beforeCreate(makeEvent(['00352 621 123 456'])));
});

test('beforeCreate rejects number missing + or 00 prefix', () => {
  assert.throws(
    () => hooks.beforeCreate(makeEvent(['352621123456'])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects non-string array element', () => {
  assert.throws(
    () => hooks.beforeCreate(makeEvent([352621123456])),
    { name: 'ValidationError' }
  );
});

test('beforeCreate rejects non-array phoneNumbers', () => {
  assert.throws(
    () => hooks.beforeCreate(makeEvent('+352621123456')),
    { name: 'ValidationError' }
  );
});

test('beforeCreate skips validation when phoneNumbers is absent', () => {
  assert.doesNotThrow(() => hooks.beforeCreate(makeEvent(undefined)));
});

test('beforeUpdate accepts valid phone numbers', () => {
  assert.doesNotThrow(() => hooks.beforeUpdate(makeEvent(['+33612345678'])));
});

test('beforeUpdate rejects invalid phone numbers', () => {
  assert.throws(
    () => hooks.beforeUpdate(makeEvent(['notaphone'])),
    { name: 'ValidationError' }
  );
});
