'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('transport-type is a collection type — admin-managed lookup', (t) => {
  const schema = loadContentType('transport-type');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'transport_types');
  t.assert.strictEqual(schema.info.singularName, 'transport-type');
  t.assert.strictEqual(schema.info.pluralName, 'transport-types');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'label', { type: 'string', required: true });
  assertAttribute(t, schema, 'description', { type: 'text' });

  const slug = schema.attributes.slug;
  t.assert.strictEqual(slug.type, 'uid');
  t.assert.strictEqual(slug.targetField, 'label');
  t.assert.strictEqual(slug.required, true);

  const transporters = schema.attributes.transporters;
  t.assert.strictEqual(transporters.type, 'relation');
  t.assert.strictEqual(transporters.relation, 'manyToMany');
  t.assert.strictEqual(transporters.target, 'api::transporter.transporter');
});
