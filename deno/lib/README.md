<div align="center">
  <img src="https://raw.githubusercontent.com/ilkhoeri/postcss-composer/refs/heads/main/logo.png" height="200px" align="center" alt="postcss-composer logo" />
</div>

# postcss-composer

> A PostCSS plugin that provides composable utilities for styling components with custom themes, responsive units, and safe mixin-based variants. <br /> — Made for scalable UI design.

---

## ✨ Features

- Convert `rem()`, `em()` to scalable expressions
- Use `themes()` for conditional styling (e.g. dark/light/class attribute)
- Built-in support for `rgb()`, `hsl()`, `hwb()`, `oklch()` with alpha manipulation
- Mixins for `hover`, `rtl`, `theme switching`, and more
- Clean and scalable configuration
- Supports custom design systems with minimal setup
- Simple CSS abstraction for scalable design systems

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
  plugins: {
    'postcss-composer': {
      'themes-attr': 'class' // Change to match your theme attribute (e.g. 'data-theme', 'color-scheme')
    }
  }
};
```

### Options

- `themes-attr`: The attribute name for theme switching (e.g. `class`, `data-theme`, `color-scheme`)
- `plugins`: An array of PostCSS plugins to be used for theme switching. You can us the same syntax as in the `postcss.config.mjs` file.
- `mixins`: An object with custom mixin names as keys and mixin functions as values. These mixins will be available in your CSS files.

```js
const customHoverMixin = {
  '@media (hover: hover)': {
    '&:hover': {
      color: 'red',
      '@mixin-content': {} // Use the mixin content
    }
  }
};

export default {
  plugins: {
    'postcss-composer': {
      'themes-attr': 'class',
      plugins: {
        'postcss-import': {},
        'postcss-custom-media': { preserve: false }
      },
      // plugins: ['postcss-import', ['postcss-custom-media', { preserve: false }]] // Alternative syntax
      mixins: {
        customHover: customHoverMixin // Register custom mixin
      }
    }
  }
};
```

## 💡 Usage

Once configured, you can use dynamic functions like `themes()`, `rem()`, `em()`, and `hls()` in your CSS:

```css
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

### TailwindCSS Compatibility

Works seamlessly inside Tailwind CSS with `arbitrary value` support:

```tsx
<span className="text-[themes(#1a1b1e,#fff)] [@mixin_ltr]:mr-auto" />
```

### TailwindCSS v4

```css
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
<span className="color-[#1a1b1e,#fff] mixin-ltr:mr-auto" />
```

## 🧩 Mixins

`postcss-composer` includes helpful mixins to handle interaction state and layout direction.

### Supported Mixins

- `hover`: Uses `:hover` or `:active` depending on device
- `ltr`: Styles for LTR mode only
- `rtl`: Styles for `[dir="rtl"]`
- `light`: Styles scoped to `[themes-attr="light"]`
- `dark`: Styles scoped to `[themes-attr="dark"]`

### Example

```css
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
    margin-right: unset;
  }
  @mixin rtl {
    margin-right: auto;
    margin-left: unset;
  }

  @mixin max 360px {
    text-align: center;
  }
  @mixin min 360px {
    text-align: start;
  }
}
```

### Technical Notes

- `@mixin hover`: will adjust between hover and active depending on the device (`@media (hover: hover)` vs `none`)
- `@mixin light` & `@mixin dark`: take the `themes-attr` value you configured, so it's flexible
- `@mixin-content` value is used dynamically, allowing nested rules without repetition

---

## 🤝 Contributing

Want to help improve `postcss-composer`?
Check out the [contribution guide](https://github.com/ilkhoeri/postcss-composer/blob/main/CONTRIBUTING.md)

---

## 📄 License

[MIT © Ilham Khoeri](https://github.com/ilkhoeri/postcss-composer/blob/main/LICENSE)
