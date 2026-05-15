'use strict';

const { markdownToBlocks } = require('./markdown-to-blocks');

/**
 * Build the Document Service `data` payload for an editorial single type
 * from a manifest entry + its markdown body. Pure — no Strapi.
 */
function buildEditorialEntry(entry, markdown) {
  const body = markdownToBlocks(markdown);
  if (body.length === 0) {
    throw new Error(`Refusing to seed ${entry.contentType}: empty body`);
  }
  return {
    title: entry.title,
    body,
    lastUpdated: entry.lastUpdated,
    seo: entry.seo,
  };
}

module.exports = { buildEditorialEntry };
