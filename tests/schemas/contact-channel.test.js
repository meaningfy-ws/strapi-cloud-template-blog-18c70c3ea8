'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('contact-channel is a collection type — admin-managed lookup', (t) => {
  const schema = loadContentType('contact-channel');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'contact_channels');
  t.assert.strictEqual(schema.info.singularName, 'contact-channel');
  t.assert.strictEqual(schema.info.pluralName, 'contact-channels');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'label', { type: 'string', required: true });
  assertAttribute(t, schema, 'description', { type: 'text' });

  const slug = schema.attributes.slug;
  t.assert.strictEqual(slug.type, 'uid');
  t.assert.strictEqual(slug.targetField, 'label');
  t.assert.strictEqual(slug.required, true);
});
