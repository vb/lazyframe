import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import scss from "rollup-plugin-scss";

export default {
  input: "src/lazyframe.js",
  output: {
    file: "dist/lazyframe.min.js",
    format: "umd",
    exports: "default",
    name: "lazyframe",
    sourcemap: true,
  },
  plugins: [
    babel({
      exclude: "node_modules/**",
      babelHelpers: "bundled",
    }),
    terser(),
    scss({
      output: "dist/lazyframe.css",
      outputStyle: "compressed",
    }),
  ],
};
