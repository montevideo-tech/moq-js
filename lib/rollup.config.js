"use strict"
const path = require("path")
const resolve = require("rollup-plugin-node-resolve")
const commonjs = require("rollup-plugin-commonjs")
const typescript = require("rollup-plugin-typescript2")
const workerLoader = require("rollup-plugin-web-worker-loader")
const sourceMaps = require("rollup-plugin-sourcemaps")
const pkg = require("./package.json")

const config = []

config.push({
	input: pkg.entry,
	output: {
		file: pkg.iife,
		format: "iife",
		name: "moqplayer",
		sourcemap: true,
	},
	plugins: [
		resolve(),
		commonjs(),
		workerLoader({ preserveSource: true }),
		typescript({
			typescript: require("typescript"),
		}),
		sourceMaps(),
	],
})

module.exports = config
