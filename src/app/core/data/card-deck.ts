/**
 * The Code Pairs deck: trademark-safe "code token" glyphs rendered as inline
 * SVG so they stay razor-sharp at any card size. `fill` is left as
 * `currentColor` so the card component controls the ink color via CSS.
 */
export interface CodeToken {
  readonly pairKey: string;
  readonly label: string;
  /** Raw (unsanitized) SVG markup; sanitized in the service. */
  readonly svg: string;
}

/** Build a centered monospace glyph SVG for a code token. */
function glyph(text: string, size: number): string {
  return (
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ` +
    `role="img" aria-hidden="true">` +
    `<text x="50" y="54" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="ui-monospace, 'JetBrains Mono', 'Fira Code', Consolas, monospace" ` +
    `font-weight="800" font-size="${size}" fill="currentColor" ` +
    `letter-spacing="-2">${text}</text></svg>`
  );
}

/** The full pool; a game randomly draws N pairs from it for replayability. */
export const CODE_TOKENS: readonly CodeToken[] = [
  { pairKey: 'braces', label: 'Braces', svg: glyph('{ }', 40) },
  { pairKey: 'tag', label: 'Tag', svg: glyph('&lt;/&gt;', 30) },
  { pairKey: 'arrow', label: 'Arrow', svg: glyph('=&gt;', 34) },
  { pairKey: 'brackets', label: 'Brackets', svg: glyph('[ ]', 42) },
  { pairKey: 'parens', label: 'Parens', svg: glyph('( )', 44) },
  { pairKey: 'semicolon', label: 'Semicolon', svg: glyph(';', 56) },
  { pairKey: 'and', label: 'Logical And', svg: glyph('&amp;&amp;', 34) },
  { pairKey: 'notequal', label: 'Not Equal', svg: glyph('!=', 42) },
  { pairKey: 'spread', label: 'Spread', svg: glyph('...', 44) },
  { pairKey: 'shell', label: 'Shell', svg: glyph('$_', 42) },
];
