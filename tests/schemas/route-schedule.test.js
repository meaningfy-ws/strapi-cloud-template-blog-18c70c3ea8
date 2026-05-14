'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('route-schedule is a collection type linking transporter to route with timing', (t) => {
  const schema = loadContentType('route-schedule');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'route_schedules');
  t.assert.strictEqual(schema.info.singularName, 'route-schedule');
  t.assert.strictEqual(schema.info.pluralName, 'route-schedules');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'departureDays', { type: 'json', required: true });
  assertAttribute(t, schema, 'arrivalDays', { type: 'json', required: true });
  assertAttribute(t, schema, 'notes', { type: 'text' });

  const frequency = schema.attributes.frequency;
  t.assert.strictEqual(frequency.type, 'relation');
  t.assert.strictEqual(frequency.relation, 'manyToOne');
  t.assert.strictEqual(frequency.target, 'api::route-frequency.route-frequency');

  const status = schema.attributes.status;
  t.assert.strictEqual(status.type, 'enumeration');
  t.assert.deepStrictEqual(status.enum, ['draft', 'approved', 'suspended']);
  t.assert.strictEqual(status.required, true);
  t.assert.strictEqual(status.default, 'approved');

  const transporter = schema.attributes.transporter;
  t.assert.strictEqual(transporter.type, 'relation');
  t.assert.strictEqual(transporter.relation, 'manyToOne');
  t.assert.strictEqual(transporter.target, 'api::transporter.transporter');

  const route = schema.attributes.route;
  t.assert.strictEqual(route.type, 'relation');
  t.assert.strictEqual(route.relation, 'manyToOne');
  t.assert.strictEqual(route.target, 'api::route.route');
});
