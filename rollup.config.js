import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript'
import css from 'rollup-plugin-import-css'

export default [
  {
    input: 'src/lazyframe.ts',
    output: {
      file: 'dist/lazyframe.min.js',
      format: 'umd',
      exports: 'default',
      name: 'lazyframe',
      sourcemap: true,
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      css({ output: 'lazyframe.css', minify: true }),
      terser(),
    ],
  },
  {
    input: 'src/lazyframe.ts',
    output: {
      file: 'dist/lazyframe.module.js',
      format: 'cjs',
      exports: 'default',
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      css({ output: 'lazyframe.css', minify: true }),
    ],
  },
]
