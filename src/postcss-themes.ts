import { atRule as postcssAtRule, decl as postcssDecl, Root } from 'postcss';

const PREFIXES = 'themes(';

function splitStringAtCharacter(c: string, s: string): string[] {
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

function getThemes(v: string): GetThemes {
  const [p, ...s] = v.split(PREFIXES);

  if (!s.length) return { light: v, dark: v };

  const [macro, suffix] = splitStringAtCharacter(')', s.join(PREFIXES));
  const [light, dark] = splitStringAtCharacter(',', macro);

  const parsedSuffix = getThemes(suffix);
  return {
    light: p + getThemes(light.trim()).light + parsedSuffix.light,
    dark: p + getThemes(dark.trim()).dark + parsedSuffix.dark
  };
}

module.exports = () => ({
  postcssPlugin: 'postcss-themes',

  Once(root: Root) {
    root.walkDecls(decl => {
      const { value, prop } = decl;
      const regex = /\bthemes\b/;
      if (regex.test(value)) {
        const { light, dark } = getThemes(value);
        const darkMixin = postcssAtRule({ name: 'mixin', params: 'dark' });
        darkMixin.append(postcssDecl({ prop, value: dark }));
        decl.parent?.insertAfter(decl, darkMixin);
        decl.parent?.insertAfter(decl, postcssDecl({ prop, value: light }));

        decl.remove();
      }
    });
  }
});

module.exports.postcss = true;
