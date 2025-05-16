import nested from 'postcss-nested';
import { em } from './postcss-units';
import type { Plugin } from 'postcss';
const mixins = require('postcss-mixins');
const remEm = require('./postcss-units');
const themes = require('./postcss-themes');
const colors = require('./postcss-colors');
/** @internal themesMixin */
function tm(themesAttr: string, theme: 'light' | 'dark', { r = false } = {}) {
  const a = themesAttr === 'class' ? (theme === 'dark' ? `.${theme}` : '') : `[${themesAttr}="${theme}"]`;
  const d = r ? `&${a}` : `${a} &`;
  return {
    [d]: {
      '@mixin-content': {}
    }
  };
}
/** @internal minScreenMixin */
function mis(_: string, width: string) {
  return {
    [`@media (width >= ${em(width)})`]: {
      '@mixin-content': {}
    }
  };
}
/** @internal maxScreenMixin */
function mas(_: string, width: string) {
  return {
    [`@media (width < ${em(width)})`]: {
      '@mixin-content': {}
    }
  };
}
/** @internal dirMixin */
const dir = {
  ltr: {
    '&:where(:not([dir="rtl"])) &': {
      '@mixin-content': {}
    }
  },
  rtl: {
    '&:where([dir="rtl"]) &': {
      '@mixin-content': {}
    }
  }
};
/** @internal hoverMixin */
const hv = {
  '@media (hover: hover)': {
    '&:hover': {
      '@mixin-content': {}
    }
  },
  '@media not all and (hover: hover)': {
    '&:active': {
      '@mixin-content': {}
    }
  }
};

export type PluginInput = string | [string, any] | import('postcss').Plugin;

export interface Options {
  ['themes-attr']: string;
  mixins?: Record<string, any>;
  plugins?: PluginInput[] | Record<string, any>;
  // activate?: {};
}
/** @internal normalizePlugins */
function np(p: Options['plugins']): Plugin[] {
  if (!p) return [];

  if (Array.isArray(p)) {
    return p.map(p => {
      if (typeof p === 'string') {
        const mod = require(p);
        return mod.default || mod;
      }
      if (Array.isArray(p)) {
        const [name, opts] = p;
        const mod = require(name);
        return (mod.default || mod)(opts);
      }
      return p;
    });
  }

  // object case: { 'plugin-name': options }
  return Object.entries(p).map(([name, opts]) => {
    const mod = require(name);
    return (mod.default || mod)(opts);
  });
}

module.exports = (o: Options) => {
  const { 'themes-attr': a = 'class', mixins: m = {}, plugins: p = [] } = o;

  return {
    postcssPlugin: 'postcss-composer',
    plugins: [
      nested(),
      colors(),
      themes(),
      remEm(),
      mixins({
        mixins: {
          light: tm(a, 'light'),
          dark: tm(a, 'dark'),
          'light-root': tm(a, 'light', { r: true }),
          'dark-root': tm(a, 'dark', { r: true }),
          hover: hv,
          ltr: dir.ltr,
          rtl: dir.rtl,
          min: mis,
          max: mas,
          ...m
        }
      }),
      ...np(p)
    ]
  };
};

module.exports.postcss = true;
