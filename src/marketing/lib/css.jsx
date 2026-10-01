import { useState, useCallback } from 'react';

/**
 * s('padding:12px;color:var(--fg1)') -> { padding: '12px', color: 'var(--fg1)' }
 *
 * The design source is authored as CSS declaration strings. Parsing them at
 * runtime (memoised) keeps the React port declaration-for-declaration identical
 * to the design instead of hand-translating every property to camelCase.
 */
const cache = new Map();

export function s(css) {
  if (!css) return undefined;
  const hit = cache.get(css);
  if (hit) return hit;
  const out = {};
  let depth = 0, buf = '';
  const flush = () => {
    const d = buf.trim();
    buf = '';
    if (!d) return;
    const i = d.indexOf(':');
    if (i === -1) return;
    const prop = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    out[prop.startsWith('--') ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  };
  for (const ch of css) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { flush(); continue; }
    buf += ch;
  }
  flush();
  cache.set(css, out);
  return out;
}

/** Element with an optional hover style layer (CSS strings, same as `s`). */
export function Box({ as: Tag = 'div', css, hover, style, children, ...rest }) {
  const [on, setOn] = useState(false);
  const enter = useCallback(() => hover && setOn(true), [hover]);
  const leave = useCallback(() => hover && setOn(false), [hover]);
  return (
    <Tag
      style={{ ...s(css), ...(on && hover ? s(hover) : null), ...style }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Dot colours used by the mock data tables. */
export const DOT = { green: '#24B34B', orange: '#F58220', purple: '#A51BFC', grey: '#AFAEA4' };
