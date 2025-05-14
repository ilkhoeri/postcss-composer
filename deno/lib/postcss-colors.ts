import type { Declaration, Root } from 'postcss';

/** Convert hex string to RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

/** Convert RGB to HSL format string */
function rgbToHsl({ r, g, b }: { r: number; g: number; b: number }, alpha?: string): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
      default:
        h = 0;
    }
    h *= 60;
  }

  return `hsl(${h.toFixed(2)}deg ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}%${alpha ? ` / ${alpha}` : ''})`;
}

/** Convert RGB to RGB string */
function rgbToString({ r, g, b }: { r: number; g: number; b: number }, alpha?: string): string {
  return `rgb(${r} ${g} ${b}${alpha ? ` / ${alpha}` : ''})`;
}

/** Convert RGB to HWB format string */
function rgbToHwb({ r, g, b }: { r: number; g: number; b: number }, alpha?: string): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  if (max === min) h = 0;
  else if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
  else if (max === g) h = (60 * ((b - r) / (max - min)) + 120) % 360;
  else if (max === b) h = (60 * ((r - g) / (max - min)) + 240) % 360;

  const w = Math.min(r, g, b) * 100;
  const bl = (1 - max) * 100;

  return `hwb(${h.toFixed(2)}deg ${w.toFixed(2)}% ${bl.toFixed(2)}%${alpha ? ` / ${alpha}` : ''})`;
}

/** Convert RGB to OKLCH format string (approximate, simplified) */
function rgbToOklch({ r, g, b }: { r: number; g: number; b: number }, alpha?: string): string {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const c = 0.01; // placeholder chroma
  const h = 0; // placeholder hue
  return `oklch(${(l / 255).toFixed(2)} ${c.toFixed(2)} ${h.toFixed(2)}${alpha ? ` / ${alpha}` : ''})`;
}

/** Extract CSS variable and alpha from function */
function extractParts(value: string): { fn: string; varName: string; alpha?: string } | null {
  const match = /^(hsl|rgb|hwb|oklch)\(var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?\)$/.exec(value);
  if (!match) return null;
  const [, fn, varName, alpha] = match;
  return { fn, varName, alpha };
}

module.exports = () => ({
  postcssPlugin: 'postcss-colors',

  Once(root: Root) {
    const variables: Record<string, string> = {};

    // Step 1: Collect variable definitions from :root
    root.walkRules(':root', rule => {
      rule.walkDecls(decl => {
        if (decl.prop.startsWith('--') && /^#(?:[0-9a-fA-F]{6})$/.test(decl.value)) {
          variables[decl.prop] = decl.value;
        }
      });
    });

    // Step 2: Replace color functions using the collected variables
    root.walkDecls((decl: Declaration) => {
      const parts = extractParts(decl.value.trim());
      if (!parts) return;

      const hex = variables[parts.varName];
      if (!hex) return;

      const rgb = hexToRgb(hex);
      let result = decl.value;

      switch (parts.fn) {
        case 'hsl':
          result = rgbToHsl(rgb, parts.alpha);
          break;
        case 'rgb':
          result = rgbToString(rgb, parts.alpha);
          break;
        case 'hwb':
          result = rgbToHwb(rgb, parts.alpha);
          break;
        case 'oklch':
          result = rgbToOklch(rgb, parts.alpha);
          break;
        default:
          break;
      }

      decl.value = result;
    });
  }
});

module.exports.postcss = true;
