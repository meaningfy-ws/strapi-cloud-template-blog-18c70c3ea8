'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('route-frequency is a collection type — admin-managed lookup', (t) => {
  const schema = loadContentType('route-frequency');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'route_frequencies');
  t.assert.strictEqual(schema.info.singularName, 'route-frequency');
  t.assert.strictEqual(schema.info.pluralName, 'route-frequencies');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'label', { type: 'string', required: true });
  assertAttribute(t, schema, 'description', { type: 'text' });

  const slug = schema.attributes.slug;
  t.assert.strictEqual(slug.type, 'uid');
  t.assert.strictEqual(slug.targetField, 'label');
  t.assert.strictEqual(slug.required, true);

  const schedules = schema.attributes.schedules;
  t.assert.strictEqual(schedules.type, 'relation');
  t.assert.strictEqual(schedules.relation, 'oneToMany');
  t.assert.strictEqual(schedules.target, 'api::route-schedule.route-schedule');
});
