'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('transporter is a collection type with operator profile fields', (t) => {
  const schema = loadContentType('transporter');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'transporters');
  t.assert.strictEqual(schema.info.singularName, 'transporter');
  t.assert.strictEqual(schema.info.pluralName, 'transporters');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'name', { type: 'string', required: true });
  assertAttribute(t, schema, 'phoneNumbers', { type: 'json', required: true });
  assertAttribute(t, schema, 'notes', { type: 'text' });
  assertAttribute(t, schema, 'submittedBy', { type: 'string' });
  assertAttribute(t, schema, 'claimedBy', { type: 'string' });

  const type = schema.attributes.type;
  t.assert.strictEqual(type.type, 'enumeration');
  t.assert.deepStrictEqual(type.enum, ['individual', 'company']);
  t.assert.strictEqual(type.required, true);
  t.assert.strictEqual(type.default, 'individual');

  const status = schema.attributes.status;
  t.assert.strictEqual(status.type, 'enumeration');
  t.assert.deepStrictEqual(status.enum, ['draft', 'approved', 'suspended']);
  t.assert.strictEqual(status.required, true);
  t.assert.strictEqual(status.default, 'approved');

  const transportTypes = schema.attributes.transportTypes;
  t.assert.strictEqual(transportTypes.type, 'relation');
  t.assert.strictEqual(transportTypes.relation, 'manyToMany');
  t.assert.strictEqual(transportTypes.target, 'api::transport-type.transport-type');

  const schedules = schema.attributes.schedules;
  t.assert.strictEqual(schedules.type, 'relation');
  t.assert.strictEqual(schedules.relation, 'oneToMany');
  t.assert.strictEqual(schedules.target, 'api::route-schedule.route-schedule');
});
