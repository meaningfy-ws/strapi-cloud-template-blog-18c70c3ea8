'use strict';

const { test } = require('node:test');
const { loadContentType, assertAttribute } = require('../helpers/schema');

test('waitlist-submission is a collection type capturing signup payload', (t) => {
  const schema = loadContentType('waitlist-submission');

  t.assert.strictEqual(schema.kind, 'collectionType');
  t.assert.strictEqual(schema.collectionName, 'waitlist_submissions');
  t.assert.strictEqual(schema.info.singularName, 'waitlist-submission');
  t.assert.strictEqual(schema.info.pluralName, 'waitlist-submissions');
  t.assert.strictEqual(schema.options.draftAndPublish, false);

  assertAttribute(t, schema, 'name', { type: 'string', required: true });
  assertAttribute(t, schema, 'email', { type: 'email', required: true });
  assertAttribute(t, schema, 'whatsapp', { type: 'string' });
  assertAttribute(t, schema, 'routes', { type: 'string', required: true });

  const role = schema.attributes.role;
  t.assert.strictEqual(role.type, 'enumeration');
  t.assert.deepStrictEqual(role.enum, ['expeditor', 'transportator', 'ambele']);
  t.assert.strictEqual(role.required, true);
  t.assert.strictEqual(role.default, 'expeditor');
});
