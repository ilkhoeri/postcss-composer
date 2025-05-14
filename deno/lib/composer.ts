import nested from 'postcss-nested';
import { em } from './postcss-units.ts';
import type { Plugin } from 'postcss';
const mixins = require('postcss-mixins');
const remEm = require('./postcss-units');
const themes = require('./postcss-themes');
const colors = require('./postcss-colors');

function themesMixin(themesAttr: string, theme: 'light' | 'dark', { inRoot = false } = {}) {
  const attr = `${themesAttr}="${theme}"`;
  return {
    [inRoot ? `&[${attr}]` : `[${attr}] &`]: {
      '@mixin-content': {}
    }
  };
}

function minScreenMixin(_: string, width: string) {
  return {
    [`@media (width >= ${em(width)})`]: {
      '@mixin-content': {}
    }
  };
}

function maxScreenMixin(_: string, width: string) {
  return {
    [`@media (width < ${em(width)})`]: {
      '@mixin-content': {}
    }
  };
}

function dirMixin(dir: 'ltr' | 'rtl') {
  return {
    [dir === 'ltr' ? '&:where(:not([dir="rtl"])) &' : '&:where([dir="rtl"]) &']: {
      '@mixin-content': {}
    }
  };
}

const hoverMixin = {
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
}

function normalizePlugins(plugins: Options['plugins']): Plugin[] {
  if (!plugins) return [];

  if (Array.isArray(plugins)) {
    return plugins.map(p => {
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
  return Object.entries(plugins).map(([name, opts]) => {
    const mod = require(name);
    return (mod.default || mod)(opts);
  });
}

module.exports = (opts: Options) => {
  const { 'themes-attr': attr, mixins: m = {}, plugins = [] } = opts;
  const normalizedPlugins = normalizePlugins(plugins);

  return {
    postcssPlugin: 'postcss-composer',
    plugins: [
      nested(),
      colors(),
      themes(),
      remEm(),
      mixins({
        mixins: {
          light: themesMixin(attr, 'light'),
          dark: themesMixin(attr, 'dark'),
          'light-root': themesMixin(attr, 'light', { inRoot: true }),
          'dark-root': themesMixin(attr, 'dark', { inRoot: true }),
          hover: hoverMixin,
          ltr: dirMixin('ltr'),
          rtl: dirMixin('rtl'),
          min: minScreenMixin,
          max: maxScreenMixin,
          ...m
        }
      }),
      ...normalizedPlugins
    ]
  };
};

module.exports.postcss = true;
