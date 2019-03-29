/** @format */

import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import globals from 'rollup-plugin-node-globals'
import sourcemaps from 'rollup-plugin-sourcemaps'

export default {
  output: {format: 'esm'},
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: ['@babel/preset-env', '@babel/preset-react']
    }),
    commonjs({
      exclude: 'node_modules/process-es6/**',
      include: [
        'node_modules/create-react-class/**',
        'node_modules/fbjs/**',
        'node_modules/object-assign/**',
        'node_modules/react/**',
        'node_modules/react-dom/**',
        'node_modules/prop-types/**'
      ]
    }),
    globals(),
    nodeResolve({
      main: true,
      browser: true
    }),
    sourcemaps()
  ]
}
