'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('route is a collection type with geocoded city corridor fields', (t) => {
  const schema = loadContentType('route');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'routes');
  t.assert.strictEqual(schema.info.singularName, 'route');
  t.assert.strictEqual(schema.info.pluralName, 'routes');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'name', { type: 'string', required: true });
  assertAttribute(t, schema, 'citiesText', { type: 'string', required: true });
  assertAttribute(t, schema, 'geoJson', { type: 'json' });
  assertAttribute(t, schema, 'submittedBy', { type: 'string' });
  assertAttribute(t, schema, 'claimedBy', { type: 'string' });

  const status = schema.attributes.status;
  t.assert.strictEqual(status.type, 'enumeration');
  t.assert.deepStrictEqual(status.enum, ['draft', 'approved', 'suspended']);
  t.assert.strictEqual(status.required, true);
  t.assert.strictEqual(status.default, 'approved');

  const schedules = schema.attributes.schedules;
  t.assert.strictEqual(schedules.type, 'relation');
  t.assert.strictEqual(schedules.relation, 'oneToMany');
  t.assert.strictEqual(schedules.target, 'api::route-schedule.route-schedule');
});
