import type { AtRule, Declaration, Root } from 'postcss';

const unsafePattern = /^(calc|clamp)\(|(rgba|var|min|max|url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient)\(/;

function scale(v: string): string {
  return `calc(${v} * var(--scale, 1))`;
}

function converter(units: 'rem' | 'em', { scaling = false, transform = true } = {}) {
  function convert(v: string | number): string {
    if ((v === 0 || v === '0') && transform) return `0${units}`;

    if (typeof v === 'number') {
      const val = `${v / 16}${units}`;
      return scaling ? scale(val) : val;
    }

    if (typeof v === 'string') {
      if (unsafePattern.test(v)) return v;

      const delimiter = v.includes(',') ? ',' : v.includes(' ') ? ' ' : null;
      if (delimiter) {
        return v
          .split(delimiter)
          .map(val => convert(val.trim()))
          .join(delimiter);
      }

      if (v.includes(units)) return scaling ? scale(v) : v;

      const r = v.replace('px', '');
      const parsed = Number(r);
      if (r === v && !transform) return v;
      if (!Number.isNaN(parsed)) {
        const val = `${parsed / 16}${units}`;
        return scaling ? scale(val) : val;
      }
    }

    return v as string;
  }

  return convert;
}

const rem = converter('rem', { scaling: true });
export const em = converter('em');
const remNoScale = converter('rem');
const remStrict = converter('rem', { scaling: true, transform: false });

const createUnitRegExp = (unit: 'rem' | 'em') => new RegExp(`\\b${unit}\\(([^()]+)\\)`, 'g');

const unitRegExps = {
  rem: createUnitRegExp('rem'),
  em: createUnitRegExp('em')
};

function replaceUnitValues(input: string, unit: 'rem' | 'em', fn: (val: string) => string) {
  const regexp = unitRegExps[unit];
  return input.replace(regexp, (_, value) => fn(value));
}

module.exports = () => ({
  postcssPlugin: 'postcss-units',

  Once(root: Root) {
    root.replaceValues(unitRegExps.rem, { fast: 'rem(' }, (_, val) => rem(val));
    root.replaceValues(unitRegExps.em, { fast: 'em(' }, (_, val) => em(val));
  },

  Declaration(decl: Declaration) {
    if (!decl.value.includes('px')) return;
    if (decl.prop === 'content') return;
    decl.value = remStrict(decl.value);
  },

  AtRule: {
    media(atRule: AtRule) {
      atRule.params = replaceUnitValues(
        replaceUnitValues(atRule.params, 'rem', val => remNoScale(val)),
        'em',
        val => em(val)
      );
    },
    container(atRule: AtRule) {
      atRule.params = replaceUnitValues(
        replaceUnitValues(atRule.params, 'rem', val => remNoScale(val)),
        'em',
        val => em(val)
      );
    }
  }
});

module.exports.postcss = true;
