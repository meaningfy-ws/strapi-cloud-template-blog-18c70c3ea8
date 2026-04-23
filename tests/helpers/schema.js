'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function loadJson(relPath) {
  const full = path.join(REPO_ROOT, relPath);
  if (!fs.existsSync(full)) {
    throw new Error(`Schema file not found: ${relPath}`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

function loadContentType(apiName) {
  return loadJson(`src/api/${apiName}/content-types/${apiName}/schema.json`);
}

function loadComponent(category, name) {
  return loadJson(`src/components/${category}/${name}.json`);
}

function assertAttribute(t, schema, name, expected) {
  const attr = schema.attributes[name];
  t.assert.ok(attr, `attribute "${name}" is missing`);
  for (const [key, value] of Object.entries(expected)) {
    t.assert.strictEqual(
      attr[key],
      value,
      `attribute "${name}".${key} expected ${JSON.stringify(value)}, got ${JSON.stringify(attr[key])}`
    );
  }
}

function assertComponentAttribute(t, schema, name, componentId, { repeatable = false, required = undefined } = {}) {
  const attr = schema.attributes[name];
  t.assert.ok(attr, `attribute "${name}" is missing`);
  t.assert.strictEqual(attr.type, 'component', `"${name}" must be type "component"`);
  t.assert.strictEqual(attr.component, componentId, `"${name}" must reference "${componentId}"`);
  t.assert.strictEqual(Boolean(attr.repeatable), repeatable, `"${name}" repeatable mismatch`);
  if (required !== undefined) {
    t.assert.strictEqual(Boolean(attr.required), required, `"${name}" required mismatch`);
  }
}

module.exports = {
  REPO_ROOT,
  loadJson,
  loadContentType,
  loadComponent,
  assertAttribute,
  assertComponentAttribute,
};
