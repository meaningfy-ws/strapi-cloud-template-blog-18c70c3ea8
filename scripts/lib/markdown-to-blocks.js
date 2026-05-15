'use strict';

/**
 * Minimal Markdown -> Strapi 5 Blocks converter.
 *
 * Scope is deliberately limited to what the editorial pages use:
 *   - paragraphs (blank-line separated)
 *   - ## / ### headings
 *   - "- " unordered lists
 *   - inline **bold**, *italic*, `code`, [label](url)
 *
 * Not a general Markdown engine — keep it small and TDD-pinned. Extend only
 * with a failing test first.
 */

// --- inline ----------------------------------------------------------------

// Ordered so that code (no nesting) and links are handled before emphasis.
const INLINE_RE =
  /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/;

function inlineToNodes(text) {
  const nodes = [];
  let rest = text;

  while (rest.length > 0) {
    const m = rest.match(INLINE_RE);
    if (!m) {
      nodes.push({ type: 'text', text: rest });
      break;
    }
    if (m.index > 0) {
      nodes.push({ type: 'text', text: rest.slice(0, m.index) });
    }
    const token = m[0];

    if (token.startsWith('`')) {
      nodes.push({ type: 'text', text: token.slice(1, -1), code: true });
    } else if (token.startsWith('[')) {
      const lm = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      nodes.push({
        type: 'link',
        url: lm[2],
        children: [{ type: 'text', text: lm[1] }],
      });
    } else if (token.startsWith('**')) {
      nodes.push({ type: 'text', text: token.slice(2, -2), bold: true });
    } else {
      nodes.push({ type: 'text', text: token.slice(1, -1), italic: true });
    }
    rest = rest.slice(m.index + token.length);
  }

  return nodes;
}

// --- blocks ----------------------------------------------------------------

function headingBlock(line) {
  const m = line.match(/^(#{1,6})\s+(.*)$/);
  return {
    type: 'heading',
    level: m[1].length,
    children: inlineToNodes(m[2].trim()),
  };
}

function listBlock(lines) {
  return {
    type: 'list',
    format: 'unordered',
    children: lines.map((l) => ({
      type: 'list-item',
      children: inlineToNodes(l.replace(/^-\s+/, '')),
    })),
  };
}

function paragraphBlock(lines) {
  return { type: 'paragraph', children: inlineToNodes(lines.join(' ').trim()) };
}

function markdownToBlocks(markdown) {
  const blocks = [];
  const paragraphs = String(markdown).replace(/\r\n/g, '\n').split(/\n{2,}/);

  const isHeading = (l) => /^#{1,6}\s+/.test(l);
  const isListItem = (l) => /^-\s+/.test(l);

  for (const para of paragraphs) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);

    // A block may interleave headings with following body text (Markdown
    // allows no blank line between them). Group runs by kind so a heading
    // never gets swallowed into a paragraph.
    let buf = [];
    let bufKind = null; // 'list' | 'para'

    const flush = () => {
      if (buf.length === 0) return;
      blocks.push(bufKind === 'list' ? listBlock(buf) : paragraphBlock(buf));
      buf = [];
      bufKind = null;
    };

    for (const line of lines) {
      if (isHeading(line)) {
        flush();
        blocks.push(headingBlock(line));
        continue;
      }
      const kind = isListItem(line) ? 'list' : 'para';
      if (bufKind && kind !== bufKind) flush();
      bufKind = kind;
      buf.push(line);
    }
    flush();
  }

  return blocks;
}

module.exports = { markdownToBlocks };
