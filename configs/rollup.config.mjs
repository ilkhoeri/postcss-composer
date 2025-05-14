// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/composer.ts',
    external: ['postcss', 'postcss-mixins', 'postcss-nested', 'postcss-values-parser'],
    output: [
      {
        file: 'lib/composer.mjs',
        format: 'es',
        sourcemap: false,
        exports: 'named'
      },
      {
        file: 'lib/composer.umd.js',
        name: 'postcssComposer',
        format: 'umd',
        sourcemap: false,
        globals: {
          postcss: 'postcss',
          'postcss-mixins': 'postcssMixins',
          'postcss-nested': 'postcssNested',
          'postcss-values-parser': 'postcssValuesParser'
        }
      }
    ],
    plugins: [
      typescript({
        tsconfig: './configs/tsconfig.esm.json',
        sourceMap: false
      })
    ]
  }
];
