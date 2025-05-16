import type { AtRule, Root } from 'postcss';

/** @internal unsafePattern */
const up = /^(calc|clamp)\(|(rgba|var|min|max|url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient)\(/;

function _sc(v: string): string {
  return `calc(${v} * var(--scale, 1))`;
}
/** @internal converter */
function ct(u: 'rem' | 'em', { s = false, n = true } = {}) {
  function convert(i: string | number): string {
    if ((i === 0 || i === '0') && n) return `0${u}`;

    if (typeof i === 'number') {
      const x = `${i / 16}${u}`;
      return s ? _sc(x) : x;
    }

    if (typeof i === 'string') {
      if (up.test(i)) return i;

      const delimiter = i.includes(',') ? ',' : i.includes(' ') ? ' ' : null;
      if (delimiter) {
        return i
          .split(delimiter)
          .map(x => convert(x.trim()))
          .join(delimiter);
      }

      if (i.includes(u)) return s ? _sc(i) : i;

      const r = i.replace('px', '');
      const parsed = Number(r);
      if (r === i && !n) return i;
      if (!Number.isNaN(parsed)) {
        const x = `${parsed / 16}${u}`;
        return s ? _sc(x) : x;
      }
    }

    return i as string;
  }

  return convert;
}

const m = ct('em');
const rm = ct('rem', { s: true });
const _rm = ct('rem');

/** @internal remove leading '--' or '-' and trailing '--scale' / '-scale' */
function ld(raw: string): string {
  return (
    'var(--' +
    raw
      .replace(/^-+/, '') // Hapus semua leading dash
      .replace(/^--+/, '') // Hapus semua leading double dash
      .replace(/--?scale$/, '') // Hapus suffix -scale atau --scale
      .replace(/[^a-zA-Z0-9]+/g, '-') // Ganti semua non-alphanumeric menjadi dash
      .replace(/^-+|-+$/g, '') // Hapus dash di awal/akhir
      .toLowerCase() +
    '-scale, 1)'
  );
}
/** @internal scale(value, factor = 1) => `calc(<rem> * <factor>)` */
function sc(i: string): string {
  const [v, s = '1'] = i.split(',').map(x => x.trim());
  const n = /^\d/.test(s) || Number.isFinite(+s) ? s : ld(s);
  return `calc(${_rm(v)} * ${n})`;
}

/** @internal createUnitRegExp */
const cur = (i: string) => new RegExp(`\\b${i}\\(([^()]+)\\)`, 'g');
/** @internal unitRegExps */
const ur = {
  rem: cur('rem'),
  em: cur('em'),
  scale: cur('scale')
};
/** @internal replaceUnitValues */
function ruv(i: string, u: keyof typeof ur, fn: (v: string) => string) {
  const rg = ur[u];
  return i.replace(rg, (_, v) => fn(v));
}

module.exports = () => ({
  postcssPlugin: 'postcss-units',

  Once(root: Root) {
    root.replaceValues(ur.rem, { fast: 'rem(' }, (_, i) => rm(i));
    root.replaceValues(ur.em, { fast: 'em(' }, (_, i) => m(i));
    root.replaceValues(ur.scale, { fast: 'scale(' }, (_, i) => sc(i));
  },

  AtRule: {
    media(atRule: AtRule) {
      atRule.params = ruv(ruv(ruv(atRule.params, 'scale', sc), 'rem', _rm), 'em', m);
    },
    container(atRule: AtRule) {
      atRule.params = ruv(ruv(ruv(atRule.params, 'scale', sc), 'rem', _rm), 'em', m);
    }
  }
});

module.exports.postcss = true;
