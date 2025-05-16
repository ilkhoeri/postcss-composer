import type { Declaration, Root, Rule } from 'postcss';
import { parse, formatCss, converter } from 'culori';

const Mode = ['a98', 'cubehelix', 'dlab', 'dlch', 'hsi', 'hsl', 'hsv', 'hwb', 'itp', 'jab', 'jch', 'lab', 'lab65', 'lch', 'lch65', 'lchuv', 'lrgb', 'luv', 'okhsl', 'okhsv', 'oklab', 'oklch', 'p3', 'prophoto', 'rec2020', 'rgb', 'xyb', 'xyz50', 'xyz65', 'yiq'] as const;
type Mode = (typeof Mode)[number];

const modeRE = new RegExp(`\\b(${Mode.join('|')})\\(var\\((--[\\w-]+)(?:,\\s*([^)]+))?\\)(?:\\s*/\\s*([\\d.]+))?\\)`, 'g');

/** @internal `normalizeHex`: Convert hex string to RGB components */
function hx(i: string) {
  if (i[0] !== '#') i = `#${i}`;
  if (i.length === 4) i = `#${i[1]}${i[1]}${i[2]}${i[2]}${i[3]}${i[3]}`;
  return i;
}

// function resolveVariable(rule: Rule, varName: string): string | undefined {
//   let current: Rule | Root | undefined = rule;
//   let value: string | undefined;

//   while (current) {
//     if ('walkDecls' in current) {
//       current.walkDecls(varName, decl => {
//         const parsed = parse(decl.value.trim());
//         if (parsed) value = decl.value.trim();
//       });
//       if (value) return value;
//     }
//     current = (current as any).parent;
//   }

//   return undefined;
// }

function switchColor(fn: Mode, hex: string, alpha: string | undefined, defaultReturn: string) {
  const colorObj = parse(hex);
  if (!colorObj) return defaultReturn;

  const convertTo = converter(fn); // safe: fn bisa hsl, rgb, jab, okhsv, dll
  const converted = convertTo({ ...colorObj, alpha: alpha ? Number(alpha) : colorObj.alpha });
  if (!converted) return defaultReturn;

  return formatCss(converted);
}

function resolveVariable(rule: Rule, varName: string, fallback?: string): string | undefined {
  let current: Rule | Root | undefined = rule;
  let value: string | undefined;

  while (current) {
    if ('walkDecls' in current) {
      current.walkDecls(varName, decl => {
        const parsed = parse(decl.value.trim());
        if (parsed) value = decl.value.trim();
      });
      if (value) return value;
    }
    current = (current as any).parent;
  }

  // Fallback support
  if (fallback) {
    const parsedFallback = parse(fallback);
    if (parsedFallback) return fallback;
  }

  return undefined;
}

function resolveValueRecursive(rule: Rule, rawValue: string, visited = new Set<string>()): string | undefined {
  const varMatch = rawValue.match(/^var\((--[\w-]+)(?:,\s*([^)]+))?\)$/);
  if (!varMatch) return rawValue;

  const [, varName, fallback] = varMatch;
  if (visited.has(varName)) return fallback; // Avoid infinite loop
  visited.add(varName);

  const resolved = resolveVariable(rule, varName, fallback);
  if (!resolved) return fallback;
  return resolveValueRecursive(rule, resolved, visited);
}

// function switchColor(fn: string, hex: string, alpha: string | undefined, defaultReturn: string) {
//   const colorObj = parse(hex);
//   if (!colorObj) return defaultReturn;
//   const color = { ...colorObj, alpha: alpha ? Number(alpha) : colorObj.alpha };

//   switch (fn) {
//     case 'hsl':
//       return formatHsl(color);
//     case 'rgb':
//       return formatRgb(color);
//     case 'hwb':
//       return formatCss(color);
//     case 'oklch':
//       return formatCss(color);
//     default:
//       return defaultReturn;
//   }
// }

module.exports = () => ({
  postcssPlugin: 'postcss-colors',
  Once(root: Root) {
    const allVariables: Record<string, string[]> = {};

    root.walkRules(rule => {
      rule.walkDecls(decl => {
        if (decl.prop.startsWith('--') && /^#(?:[0-9a-fA-F]{6})$/.test(hx(decl.value))) {
          if (!allVariables[decl.prop]) allVariables[decl.prop] = [];
          allVariables[decl.prop].push(hx(decl.value));
        }
      });
    });

    root.walkDecls((decl: Declaration) => {
      // const updated = decl.value.replace(/\b(hsl|rgb|hwb|oklch)\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)/g, (_, fn: Mode, varName: string, alpha?: string) => {
      //   const hex = resolveVariable(decl.parent as Rule, varName);
      //   const defaultReturn = `${fn}(var(${varName})${alpha ? ` / ${alpha}` : ''})`;
      //   if (!hex) return defaultReturn;
      //   return switchColor(fn, hex, alpha, defaultReturn);
      // });

      const updated = decl.value.replace(modeRE, (_, fn: Mode, varName: string, fallback: string | undefined, alpha?: string) => {
        const rawValue = resolveVariable(decl.parent as Rule, varName, fallback);
        const resolved = rawValue ? resolveValueRecursive(decl.parent as Rule, rawValue) : undefined;
        const defaultReturn = `${fn}(var(${varName}${fallback ? `, ${fallback}` : ''})${alpha ? ` / ${alpha}` : ''})`;
        if (!resolved) return defaultReturn;
        return switchColor(fn, resolved, alpha, defaultReturn);
      });

      decl.value = updated;
    });
  }
});

module.exports.postcss = true;
