'use strict';

// Feature: markdown -> Strapi 5 Blocks converter
//   The editorial seed stores human-editable markdown; the page-* `body`
//   field is the Blocks type. This pure converter bridges the two so §4
//   content population is repeatable, not hand-keyed JSON.

const { test } = require('node:test');
const path = require('node:path');

const { markdownToBlocks } = require(path.resolve(
  __dirname,
  '../../scripts/lib/markdown-to-blocks.js'
));

test('a plain paragraph becomes one paragraph block', (t) => {
  const out = markdownToBlocks('Salut lume.');
  t.assert.deepStrictEqual(out, [
    { type: 'paragraph', children: [{ type: 'text', text: 'Salut lume.' }] },
  ]);
});

test('blank-line separated paragraphs become separate blocks', (t) => {
  const out = markdownToBlocks('Unu.\n\nDoi.');
  t.assert.strictEqual(out.length, 2);
  t.assert.strictEqual(out[0].type, 'paragraph');
  t.assert.strictEqual(out[1].children[0].text, 'Doi.');
});

test('## and ### become heading blocks with correct level', (t) => {
  const out = markdownToBlocks('## Titlu doi\n\n### Titlu trei');
  t.assert.deepStrictEqual(out[0], {
    type: 'heading',
    level: 2,
    children: [{ type: 'text', text: 'Titlu doi' }],
  });
  t.assert.strictEqual(out[1].level, 3);
});

test('a dash list becomes an unordered list with list-item children', (t) => {
  const out = markdownToBlocks('- unu\n- doi');
  t.assert.strictEqual(out[0].type, 'list');
  t.assert.strictEqual(out[0].format, 'unordered');
  t.assert.strictEqual(out[0].children.length, 2);
  t.assert.strictEqual(out[0].children[0].type, 'list-item');
  t.assert.strictEqual(out[0].children[0].children[0].text, 'unu');
});

test('inline bold, italic and code produce marked text nodes', (t) => {
  const [p] = markdownToBlocks('Ai *opțional* un **nume** în `localStorage`.');
  t.assert.deepStrictEqual(p.children, [
    { type: 'text', text: 'Ai ' },
    { type: 'text', text: 'opțional', italic: true },
    { type: 'text', text: ' un ' },
    { type: 'text', text: 'nume', bold: true },
    { type: 'text', text: ' în ' },
    { type: 'text', text: 'localStorage', code: true },
    { type: 'text', text: '.' },
  ]);
});

test('a markdown link becomes a link node wrapping a text child', (t) => {
  const [p] = markdownToBlocks('Vezi [confidențialitate](/confidentialitate) aici.');
  t.assert.deepStrictEqual(p.children[1], {
    type: 'link',
    url: '/confidentialitate',
    children: [{ type: 'text', text: 'confidențialitate' }],
  });
});

test('a heading directly followed by body text (no blank line) splits into heading + paragraph', (t) => {
  const out = markdownToBlocks('### Clienți noi\nExpeditorii vin pe platformă.');
  t.assert.strictEqual(out.length, 2);
  t.assert.deepStrictEqual(out[0], {
    type: 'heading',
    level: 3,
    children: [{ type: 'text', text: 'Clienți noi' }],
  });
  t.assert.strictEqual(out[1].type, 'paragraph');
  t.assert.strictEqual(out[1].children[0].text, 'Expeditorii vin pe platformă.');
});

test('a paragraph keeps its own soft-wrapped lines joined', (t) => {
  const [p] = markdownToBlocks('Linia unu\ncontinuă aici.');
  t.assert.strictEqual(p.type, 'paragraph');
  t.assert.strictEqual(p.children[0].text, 'Linia unu continuă aici.');
});

test('bold lead-in inside a list item is preserved', (t) => {
  const [list] = markdownToBlocks('- **Ce stocăm:** numele tău');
  t.assert.deepStrictEqual(list.children[0].children, [
    { type: 'text', text: 'Ce stocăm:', bold: true },
    { type: 'text', text: ' numele tău' },
  ]);
});
