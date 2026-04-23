'use strict';

const { test } = require('node:test');
const path = require('node:path');

const { REPO_ROOT, loadContentType, loadComponent } = require('../helpers/schema');

const SEED_PATH = path.join(REPO_ROOT, 'data/landing-page.json');
const seed = require(SEED_PATH);

// --- Schema-conformance helpers --------------------------------------------

function requiredAttrs(schema) {
  return Object.entries(schema.attributes)
    .filter(([, a]) => a.required)
    .map(([name]) => name);
}

function assertAllRequired(t, obj, schema, label) {
  for (const attr of requiredAttrs(schema)) {
    t.assert.ok(
      obj[attr] !== undefined && obj[attr] !== null && obj[attr] !== '',
      `${label}: missing required attribute "${attr}"`
    );
  }
}

// --- Exact-copy spot checks (from design/hulubul-landing-v2.html) ----------

test('seed matches source HTML title and meta description', (t) => {
  t.assert.strictEqual(
    seed.seo.metaTitle,
    'hulubul.com — Trimite un colet acasă, fără bătăi de cap'
  );
  t.assert.strictEqual(
    seed.seo.metaDescription,
    'Platforma care conectează diaspora cu transportatorii care trec prin orașul tău. Un singur loc, fără telefoane nesfârșite prin grupurile de Facebook.'
  );
});

test('seed nav preserves hulubul + .com split', (t) => {
  t.assert.strictEqual(seed.nav.logoText, 'hulubul');
  t.assert.strictEqual(seed.nav.logoAccent, '.com');
  t.assert.strictEqual(seed.nav.ctaLabel, 'Mă înscriu');
  t.assert.strictEqual(seed.nav.ctaHref, '#signup');
});

test('seed hero split-title matches the source headline exactly', (t) => {
  t.assert.strictEqual(seed.hero.titleLead, 'Trimite un colet acasă,');
  t.assert.strictEqual(seed.hero.titleEmphasis, 'fără bătăi de cap.');
  t.assert.strictEqual(seed.hero.primaryCtaLabel, 'Anunță-mă la lansare');
  t.assert.strictEqual(seed.hero.eyebrow, 'În pregătire pentru lansare');
});

test('seed hero postcard has the three handwritten lines in order', (t) => {
  t.assert.strictEqual(seed.hero.handwrittenLines.length, 3);
  t.assert.strictEqual(seed.hero.handwrittenLines[0].text, 'Mamă, am trimis coletul săptămâna asta.');
  t.assert.strictEqual(seed.hero.handwrittenLines[1].text, 'Tolea pleacă miercuri, ajunge vineri la tine.');
  t.assert.strictEqual(seed.hero.handwrittenLines[2].text, 'Te sună înainte, să fii acasă.');
  t.assert.strictEqual(seed.hero.routeFromCity, 'Luxembourg');
  t.assert.strictEqual(seed.hero.routeToCity, 'Chișinău');
});

test('seed problem section has exactly 3 numbered cards', (t) => {
  t.assert.strictEqual(seed.problem.label, 'Problema');
  t.assert.strictEqual(seed.problem.titleEmphasis, 'nu-i așa?');
  t.assert.strictEqual(seed.problem.cards.length, 3);
  t.assert.deepStrictEqual(
    seed.problem.cards.map((c) => c.number),
    ['01', '02', '03']
  );
  t.assert.strictEqual(seed.problem.cards[0].title, 'Cauți ore întregi');
});

test('seed how-it-works has 3 steps numbered 1..3', (t) => {
  t.assert.strictEqual(seed.howItWorks.label, 'Cum funcționează');
  t.assert.strictEqual(seed.howItWorks.titleLead, 'Trei pași.');
  t.assert.strictEqual(seed.howItWorks.titleEmphasis, 'Atât.');
  t.assert.deepStrictEqual(
    seed.howItWorks.steps.map((s) => s.number),
    ['1', '2', '3']
  );
});

test('seed audience section has 2 cards with correct roles', (t) => {
  t.assert.strictEqual(seed.audience.cards.length, 2);
  t.assert.strictEqual(seed.audience.cards[0].role, 'expeditor');
  t.assert.strictEqual(seed.audience.cards[1].role, 'transportator');
  t.assert.strictEqual(seed.audience.cards[0].iconEmoji, '📦');
  t.assert.strictEqual(seed.audience.cards[1].iconEmoji, '🚐');
});

test('seed trust section has 4 items with the exact glyphs', (t) => {
  t.assert.strictEqual(seed.trust.items.length, 4);
  t.assert.deepStrictEqual(
    seed.trust.items.map((i) => i.glyph),
    ['€', '◷', '✦', '✎']
  );
});

test('seed signup section has 3 role options and a mid-sentence emphasis', (t) => {
  t.assert.strictEqual(seed.signup.titleLead, 'Intră pe listă, fii');
  t.assert.strictEqual(seed.signup.titleEmphasis, 'primul');
  t.assert.strictEqual(seed.signup.titleTrail, ' anunțat.');
  t.assert.strictEqual(seed.signup.roleOptions.length, 3);
  t.assert.deepStrictEqual(
    seed.signup.roleOptions.map((o) => o.value),
    ['expeditor', 'transportator', 'ambele']
  );
  t.assert.strictEqual(seed.signup.roleDefault, 'expeditor');
  t.assert.strictEqual(seed.signup.submitLabel, 'Mă înscriu pe listă →');
});

test('seed FAQ has 6 items, first answer is about launch timing', (t) => {
  t.assert.strictEqual(seed.faq.items.length, 6);
  t.assert.strictEqual(seed.faq.items[0].question, 'Când lansați?');
  t.assert.match(seed.faq.items[0].answer, /lista de așteptare/i);
});

test('seed footer has 2 columns and the exact copyright line', (t) => {
  t.assert.strictEqual(seed.footer.columns.length, 2);
  t.assert.strictEqual(seed.footer.columns[0].title, 'Platformă');
  t.assert.strictEqual(seed.footer.columns[1].title, 'Contact');
  t.assert.strictEqual(
    seed.footer.copyrightText,
    '© 2026 hulubul.com — Toate drepturile rezervate.'
  );
  t.assert.strictEqual(
    seed.footer.locationLine,
    'Construit cu grijă, în Luxembourg și Chișinău.'
  );
});

// --- Structural conformance against schemas --------------------------------

test('every seed section satisfies the required attributes of its component', (t) => {
  const rootSchema = loadContentType('landing-page');
  for (const [attrName, attr] of Object.entries(rootSchema.attributes)) {
    if (attr.type !== 'component') continue;
    const [category, compName] = attr.component.split('.');
    const compSchema = loadComponent(category, compName);
    assertAllRequired(t, seed[attrName], compSchema, `seed.${attrName}`);
  }
});

test('every repeatable sub-component entry satisfies its required attributes', (t) => {
  const rootSchema = loadContentType('landing-page');
  for (const [attrName, attr] of Object.entries(rootSchema.attributes)) {
    if (attr.type !== 'component') continue;
    const [category, compName] = attr.component.split('.');
    const compSchema = loadComponent(category, compName);
    for (const [subAttrName, subAttr] of Object.entries(compSchema.attributes)) {
      if (subAttr.type !== 'component' || !subAttr.repeatable) continue;
      const [subCat, subComp] = subAttr.component.split('.');
      const subSchema = loadComponent(subCat, subComp);
      const items = seed[attrName][subAttrName] || [];
      items.forEach((item, idx) => {
        assertAllRequired(t, item, subSchema, `seed.${attrName}.${subAttrName}[${idx}]`);
      });
    }
  }
});
