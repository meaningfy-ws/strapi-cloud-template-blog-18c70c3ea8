'use strict';

const { test } = require('node:test');
const {
  loadContentType,
  loadComponent,
  assertAttribute,
  assertComponentAttribute,
} = require('../helpers/schema');

test('landing-page is a Strapi 5 single type with ordered section components', (t) => {
  const schema = loadContentType('landing-page');

  t.assert.strictEqual(schema.kind, 'singleType');
  t.assert.strictEqual(schema.collectionName, 'landing_pages');
  t.assert.strictEqual(schema.info.singularName, 'landing-page');
  t.assert.strictEqual(schema.info.pluralName, 'landing-pages');
  t.assert.strictEqual(schema.options.draftAndPublish, true);

  assertComponentAttribute(t, schema, 'seo', 'shared.seo', { required: true });
  assertComponentAttribute(t, schema, 'nav', 'landing.nav', { required: true });
  assertComponentAttribute(t, schema, 'hero', 'landing.hero', { required: true });
  assertComponentAttribute(t, schema, 'problem', 'landing.section-problem', { required: true });
  assertComponentAttribute(t, schema, 'howItWorks', 'landing.section-how', { required: true });
  assertComponentAttribute(t, schema, 'audience', 'landing.section-audience', { required: true });
  assertComponentAttribute(t, schema, 'trust', 'landing.section-trust', { required: true });
  assertComponentAttribute(t, schema, 'signup', 'landing.section-signup', { required: true });
  assertComponentAttribute(t, schema, 'faq', 'landing.section-faq', { required: true });
  assertComponentAttribute(t, schema, 'footer', 'landing.footer', { required: true });
});

test('shared.link captures label, href and external flag', (t) => {
  const c = loadComponent('shared', 'link');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'href', { type: 'string', required: true });
  assertAttribute(t, c, 'external', { type: 'boolean' });
});

test('landing.nav has logo text parts + single CTA', (t) => {
  const c = loadComponent('landing', 'nav');
  assertAttribute(t, c, 'logoText', { type: 'string', required: true });
  assertAttribute(t, c, 'logoAccent', { type: 'string' });
  assertAttribute(t, c, 'logoMark', { type: 'string' });
  assertAttribute(t, c, 'ctaLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'ctaHref', { type: 'string', required: true });
});

test('landing.hero has split title, subtitle, CTA and postcard content', (t) => {
  const c = loadComponent('landing', 'hero');
  assertAttribute(t, c, 'eyebrow', { type: 'string' });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'subtitle', { type: 'text' });
  assertAttribute(t, c, 'primaryCtaLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'primaryCtaHref', { type: 'string', required: true });
  assertAttribute(t, c, 'socialProofText', { type: 'string' });
  assertAttribute(t, c, 'stampLabel', { type: 'string' });
  assertAttribute(t, c, 'stampGlyph', { type: 'string' });
  assertAttribute(t, c, 'postmarkCity', { type: 'string' });
  assertAttribute(t, c, 'postmarkYear', { type: 'string' });
  assertAttribute(t, c, 'postmarkLabel', { type: 'string' });
  assertAttribute(t, c, 'routeFromCity', { type: 'string' });
  assertAttribute(t, c, 'routeFromMeta', { type: 'string' });
  assertAttribute(t, c, 'routeToCity', { type: 'string' });
  assertAttribute(t, c, 'routeToMeta', { type: 'string' });
  assertComponentAttribute(t, c, 'handwrittenLines', 'landing.postcard-line', { repeatable: true });
});

test('landing.postcard-line has a single text field', (t) => {
  const c = loadComponent('landing', 'postcard-line');
  assertAttribute(t, c, 'text', { type: 'string', required: true });
});

test('landing.section-problem groups label/title/intro/cards', (t) => {
  const c = loadComponent('landing', 'section-problem');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'intro', { type: 'text' });
  assertComponentAttribute(t, c, 'cards', 'landing.numbered-card', { repeatable: true });
});

test('landing.numbered-card holds number/title/description', (t) => {
  const c = loadComponent('landing', 'numbered-card');
  assertAttribute(t, c, 'number', { type: 'string', required: true });
  assertAttribute(t, c, 'title', { type: 'string', required: true });
  assertAttribute(t, c, 'description', { type: 'text', required: true });
});

test('landing.section-how groups label/title/intro/steps/note', (t) => {
  const c = loadComponent('landing', 'section-how');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'intro', { type: 'text' });
  assertAttribute(t, c, 'note', { type: 'text' });
  assertComponentAttribute(t, c, 'steps', 'landing.step', { repeatable: true });
});

test('landing.step holds number/title/description', (t) => {
  const c = loadComponent('landing', 'step');
  assertAttribute(t, c, 'number', { type: 'string', required: true });
  assertAttribute(t, c, 'title', { type: 'string', required: true });
  assertAttribute(t, c, 'description', { type: 'text', required: true });
});

test('landing.section-audience groups label/title/cards', (t) => {
  const c = loadComponent('landing', 'section-audience');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertComponentAttribute(t, c, 'cards', 'landing.audience-card', { repeatable: true });
});

test('landing.audience-card includes role enum, split title, icon and link', (t) => {
  const c = loadComponent('landing', 'audience-card');
  assertAttribute(t, c, 'iconEmoji', { type: 'string' });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'description', { type: 'text', required: true });
  assertAttribute(t, c, 'linkLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'linkHref', { type: 'string', required: true });
  const role = c.attributes.role;
  t.assert.strictEqual(role.type, 'enumeration');
  t.assert.deepStrictEqual(role.enum, ['expeditor', 'transportator', 'ambele']);
  t.assert.strictEqual(role.required, true);
});

test('landing.section-trust groups label/title/items', (t) => {
  const c = loadComponent('landing', 'section-trust');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertComponentAttribute(t, c, 'items', 'landing.trust-item', { repeatable: true });
});

test('landing.trust-item has glyph/title/description', (t) => {
  const c = loadComponent('landing', 'trust-item');
  assertAttribute(t, c, 'glyph', { type: 'string', required: true });
  assertAttribute(t, c, 'title', { type: 'string', required: true });
  assertAttribute(t, c, 'description', { type: 'text', required: true });
});

test('landing.section-signup has section copy, form copy, and success state', (t) => {
  const c = loadComponent('landing', 'section-signup');
  // Section copy
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'titleTrail', { type: 'string' });
  assertAttribute(t, c, 'intro', { type: 'text' });
  // Form copy
  assertAttribute(t, c, 'nameLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'nameHint', { type: 'string' });
  assertAttribute(t, c, 'namePlaceholder', { type: 'string' });
  assertAttribute(t, c, 'contactLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'contactPlaceholder', { type: 'string' });
  assertAttribute(t, c, 'roleLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'routeLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'routeHint', { type: 'string' });
  assertAttribute(t, c, 'routePlaceholder', { type: 'string' });
  assertAttribute(t, c, 'submitLabel', { type: 'string', required: true });
  assertAttribute(t, c, 'privacyNote', { type: 'text' });
  // Success state
  assertAttribute(t, c, 'successTitle', { type: 'string', required: true });
  assertAttribute(t, c, 'successMessage', { type: 'text', required: true });
  // Role options
  assertComponentAttribute(t, c, 'roleOptions', 'landing.role-option', { repeatable: true });
  // Default role
  const roleDefault = c.attributes.roleDefault;
  t.assert.strictEqual(roleDefault.type, 'enumeration');
  t.assert.deepStrictEqual(roleDefault.enum, ['expeditor', 'transportator', 'ambele']);
  t.assert.strictEqual(roleDefault.default, 'expeditor');
});

test('landing.role-option holds value enum + label', (t) => {
  const c = loadComponent('landing', 'role-option');
  const value = c.attributes.value;
  t.assert.strictEqual(value.type, 'enumeration');
  t.assert.deepStrictEqual(value.enum, ['expeditor', 'transportator', 'ambele']);
  t.assert.strictEqual(value.required, true);
  assertAttribute(t, c, 'label', { type: 'string', required: true });
});

test('landing.section-faq has label/title + repeatable items', (t) => {
  const c = loadComponent('landing', 'section-faq');
  assertAttribute(t, c, 'label', { type: 'string', required: true });
  assertAttribute(t, c, 'titleLead', { type: 'string', required: true });
  assertAttribute(t, c, 'titleEmphasis', { type: 'string', required: true });
  assertAttribute(t, c, 'titleTrail', { type: 'string' });
  assertComponentAttribute(t, c, 'items', 'landing.faq-item', { repeatable: true });
});

test('landing.faq-item has question + richtext answer', (t) => {
  const c = loadComponent('landing', 'faq-item');
  assertAttribute(t, c, 'question', { type: 'string', required: true });
  assertAttribute(t, c, 'answer', { type: 'richtext', required: true });
});

test('landing.footer has brand block + repeatable columns + bottom lines', (t) => {
  const c = loadComponent('landing', 'footer');
  assertAttribute(t, c, 'logoText', { type: 'string', required: true });
  assertAttribute(t, c, 'logoAccent', { type: 'string' });
  assertAttribute(t, c, 'logoMark', { type: 'string' });
  assertAttribute(t, c, 'tagline', { type: 'text' });
  assertAttribute(t, c, 'copyrightText', { type: 'string', required: true });
  assertAttribute(t, c, 'locationLine', { type: 'string' });
  assertComponentAttribute(t, c, 'columns', 'landing.footer-column', { repeatable: true });
});

test('landing.footer-column has title + repeatable shared.link', (t) => {
  const c = loadComponent('landing', 'footer-column');
  assertAttribute(t, c, 'title', { type: 'string', required: true });
  assertComponentAttribute(t, c, 'links', 'shared.link', { repeatable: true });
});
