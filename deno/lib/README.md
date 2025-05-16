<div align="center">
  <img src="https://raw.githubusercontent.com/ilkhoeri/postcss-composer/refs/heads/main/logo.png" height="200px" align="center" alt="postcss-composer logo" />
</div>

<br />
<br />

# postcss-composer

> A PostCSS plugin that provides composable utilities for scalable, theme-aware styling. <br /> — Made for scalable UI design. <br />
> Includes color mode conversion, dynamic theming, mixins, and scale-based units — AST-aware & Tailwind-friendly.

---

## ✨ Features

- ✅ Convert `rem()`, `em()`, and `scale()` units to responsive expressions
- 🎨 Parse `rgb()`, `hsl()`, `lab()`, `oklch()`, etc. with contextual `var()` resolution
- 🌗 Theme switching with `themes()` and `@mixin dark`, `@mixin light`, etc.
- 🧩 Mixins for `hover`, `ltr/rtl`, breakpoints, and more
- ⚙️ Fully configurable via `postcss.config.js`
- 🎯 Tailwind-compatible with support for arbitrary values and custom variants
- 🔍 AST-aware — resolves nested and inline variables properly

Required peer dependencies:

- `postcss`
- `postcss-mixins`
- `postcss-nested`
- `postcss-values-parser`

## 🚀 Installation

Install `postcss-composer` and required PostCSS plugins:

```bash
npm install postcss-composer postcss postcss-mixins postcss-nested postcss-values-parser -D
```

## ⚙️ Configuration

Add `postcss-composer` to your `postcss.config.mjs`:

```js
export default {
  plugins: ['@tailwindcss/postcss', 'autoprefixer', 'postcss-composer']
};
```

### With Option

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    'postcss-composer': {
      'themes-attr': 'class', // Change to match your theme attribute (e.g. 'data-theme', 'color-scheme')
      // Optional: register custom plugins or mixins
      plugins: {
        'postcss-import': {},
        'postcss-custom-media': { preserve: false }
      },
      // plugins: ['postcss-import', ['postcss-custom-media', { preserve: false }]] // Alternative syntax
      mixins: {
        // Register custom mixin
        customHover: {
          '@media (hover: hover)': {
            '&:hover': {
              '--color': '#f00',
              '@mixin-content': {} // Use the mixin content
            }
          }
        }
      }
    }
  }
};
```

**Note:**

- `themes-attr`: The attribute name for theme switching (e.g. `class`, `data-theme`, `color-scheme`), default value is 'class'.
- `plugins`: An array of PostCSS plugins to be used for theme switching. You can us the same syntax as in the `postcss.config.mjs` file.
- `mixins`: An object with custom mixin names as keys and mixin functions as values. These mixins will be available in your CSS files.

## 💡 Usage

Once configured, you can use dynamic functions like `scale()`, `rem()`, `em()`, and `themes()` in your `CSS`:

```css
/* css */
:root {
  --muted: #151619;
  --foreground: #18191d;
  --emphasis: #171717;
}

.btn {
  color: var(--emphasis); /* #171717 */
  border-color: hls(var(--muted) / 0.5);
  /* Converts to: hsl(225deg 10% 9% / 0.5) — currently supports rgb(), hsl(), hwb(), oklch() */
  background-color: themes(rgb(26 27 30), var(--foreground));
  /* Resolves value based on theme context (e.g. dark/light/class) */
  font-size: rem(32); /* → calc(2rem * var(--scale, 1)) */
  letter-spacing: em(4); /* → calc(0.25em * var(--scale, 1)) */
}
```

### 🎨 Color conversion

Convert contextual CSS variables (even nested or fallback!) using any `culori` mode:

```css
/* css */
:root {
  --brand: #1a1b1e;
}

.card {
  background: hsl(var(--brand) / 0.4); /* ✅ context-aware */
  border-color: oklch(var(--brand, #333) / 0.2); /* ✅ fallback supported */
  color: lab(var(--brand, #111, #fff) / 0.5); /* ✅ multi-level fallback */
}
```

**Supported color formats (`culori` Mode)**:

```ts
'a98' | 'cubehelix' | 'dlab' | 'dlch' | 'hsi' | 'hsl' | 'hsv' | 'hwb' | 'itp' | 'jab' | 'jch' | 'lab' | 'lab65' | 'lch' | 'lch65' | 'lchuv' | 'lrgb' | 'luv' | 'okhsl' | 'okhsv' | 'oklab' | 'oklch' | 'p3' | 'prophoto' | 'rec2020' | 'rgb' | 'xyb' | 'xyz50' | 'xyz65' | 'yiq';
```

### 🧩 Mixins

`postcss-composer` includes helpful mixins to handle interaction state and layout direction.

- `hover`: Uses `:hover` or `:active` depending on device
- `ltr`: Styles for LTR mode only
- `rtl`: Styles for `[dir="rtl"]`
- `light`: Styles scoped to `[themes-attr="light"]`
- `dark`: Styles scoped to `[themes-attr="dark"]`

**CSS variables**

```css
/* variables */

:root,
:host {
  @mixin light-root {
    --muted: #f0f0f0;
    --foreground: #202020;
    --emphasis: #000000;
    /* ...others */
  }
  @mixin dark-root {
    --muted: #1a1a1a;
    --foreground: #e0e0e0;
    --emphasis: #ffffff;
    /* ...others */
  }
}
```

**CSS class**

```css
/* css */

.btn {
  font-size: rem(16);

  @mixin hover {
    &:not([data-loading]):not(:disabled):not([data-disabled]) {
      --muted: #cccccc;
      --foreground: #eeeeee;
      --emphasis: #ffffff;
    }
  }

  @mixin light {
    --muted: #f0f0f0;
    --foreground: #202020;
    --emphasis: #000000;
  }
  @mixin dark {
    --muted: #1a1a1a;
    --foreground: #e0e0e0;
    --emphasis: #ffffff;
  }

  @mixin ltr {
    margin-left: auto;
  }
  @mixin rtl {
    margin-right: auto;
  }

  @mixin max 768px {
    text-align: center;
  }
  @mixin min 768px {
    text-align: start;
  }
}
```

### 📐 Scale & Unit Helpers

`scale(...)` function can support formats like:

```css
/* css */
.selector {
  font-size: rem(32px); /* → calc(2rem * var(--scale, 1)) */
  letter-spacing: em(4px); /* → calc(0.25em * var(--scale, 1)) */
  padding: scale(32px); /* → calc(2rem * 1) */
  gap: scale(24px, 3); /* → calc(1.5rem * 3) */
  width: scale(10rem, screen); /* → calc(10rem * var(--screen-scale, 1)) */
}
```

**Examples scale function**

| Input CSS                         | Output CSS                                   |
| --------------------------------- | -------------------------------------------- |
| `scale(32)`                       | `calc(2rem * 1)`                             |
| `scale(32, 3)`                    | `calc(2rem * 3)`                             |
| `scale(32, large)`                | `calc(2rem * var(--large-scale, 1))`         |
| `scale(32, --large)`              | `calc(2rem * var(--large-scale, 1))`         |
| `scale(32, -large--scale)`        | `calc(2rem * var(--large-scale, 1))`         |
| `scale(32, large-screen)`         | `calc(2rem * var(--large-screen-scale, 1))`  |
| `scale(32, --large-screen)`       | `calc(2rem * var(--large-screen-scale, 1))`  |
| `scale(32, -large-screen--scale)` | `calc(2rem * var (--large-screen-scale, 1))` |

### 🌙 Theme Context

Resolve theme-aware values based on attribute context:

```css
/* css */
.card {
  background: themes(#1a1b1e, var(--fg)); /* → themes(light, dark) */
  /* → resolves to --fg based on .dark or [data-theme="dark"] etc. */
}
```

Customizable via `themes-attr` config (e.g. `class`, `data-theme`, etc.)

### 🌀 TailwindCSS Compatibility

Works seamlessly inside Tailwind CSS with `arbitrary value` support:

```tsx
// file.tsx
<span className="text-[themes(#1a1b1e,#fff)] [@mixin_ltr]:mr-auto" />
```

### 🧪 TailwindCSS v4

```css
/* globals.css */
@import 'tailwindcss';

@custom-variant mixin-light (@mixin light);
@custom-variant mixin-dark (@mixin dark);
@custom-variant mixin-ltr (@mixin ltr);
@custom-variant mixin-rtl (@mixin rtl);

@utility color-* {
  color: themes(--value([ *]));
}
@utility background-* {
  background: themes(--value([ *]));
}
```

```tsx
// file.tsx
<span className="color-[#1a1b1e,#fff] mixin-ltr:mr-auto" />
```

## 🛠️ Technical Notes

- 🎯 `var()` resolution:
  - Supports deeply nested values (e.g. `var(--a, var(--b, #fff))`)
  - Context-aware: resolves from closest rule → parent → root
- 🎨 Color handling:
  - Uses `culori` under the hood — all formats supported
  - Auto-formats based on target function (`hsl()`, `rgb()`, `hwb()`, `oklch()`, etc.)
- 🧩 `@mixin` support:
  - The `@mixin` directive is used to define a mixin, which is a reusable block of CSS code.
  - `@mixin hover`: will adjust between hover and active depending on the device (`@media (hover: hover)` vs `none`)
  - `@mixin light` & `@mixin dark`: take the `themes-attr` value you configured, so it's flexible and can be used with any theme.
- 📌 No caching to preserve dynamicity (e.g. `:hover`, `@media`, inline overrides)
  - The current approach avoids caching to allow for dynamic contexts like `:hover`, `:active`, `@media`, and inline styles (`[--var:...]`) that can produce different results depending on the DOM state. Caching is premature and can limit user experience and developer flexibility — the first thought was to keep the plugin AST-aware and context-sensitive. So yes, keep it uncached for now.

---

## 🤝 Contributing

Want to help improve `postcss-composer`?
Check out the [contribution guide](https://github.com/ilkhoeri/postcss-composer/blob/main/CONTRIBUTING.md)

---

## 📄 License

[MIT © Ilham Khoeri](https://github.com/ilkhoeri/postcss-composer/blob/main/LICENSE)
