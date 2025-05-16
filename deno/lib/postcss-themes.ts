import { atRule, decl, Root } from 'postcss';

/** PREFIXES */
const P = 'themes(';
/** splitStringAtCharacter */
function car(c: string, s: string): string[] {
  let i = 0, // characterIndex
    o = 0; // openedParentheses

  while (i < s.length && (s[i] !== c || o)) {
    if (s[i] === '(') {
      o += 1;
    }
    if (s[i] === ')') {
      o -= 1;
    }
    i += 1;
  }

  return [s.slice(0, i), s.slice(i + 1)];
}

interface GetThemes {
  light: string;
  dark: string;
}
/** getThemes */
function gt(v: string): GetThemes {
  const [p, ...s] = v.split(P);

  if (!s.length) return { light: v, dark: v };

  const [macro, suffix] = car(')', s.join(P));
  const [light, dark] = car(',', macro);

  const parsedSuffix = gt(suffix);
  return {
    light: p + gt(light.trim()).light + parsedSuffix.light,
    dark: p + gt(dark.trim()).dark + parsedSuffix.dark
  };
}

module.exports = () => ({
  postcssPlugin: 'postcss-themes',

  Once(root: Root) {
    root.walkDecls(cb => {
      const { value, prop } = cb;
      if (/\bthemes\b/.test(value)) {
        const { light, dark } = gt(value);
        const darkMixin = atRule({ name: 'mixin', params: 'dark' });
        darkMixin.append(decl({ prop, value: dark }));
        cb.parent?.insertAfter(cb, darkMixin);
        cb.parent?.insertAfter(cb, decl({ prop, value: light }));

        cb.remove();
      }
    });
  }
});

module.exports.postcss = true;
