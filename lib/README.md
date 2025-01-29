# Media over QUIC

Media over QUIC (MoQ) is a live media delivery protocol utilizing QUIC streams.
See the [Warp draft](https://datatracker.ietf.org/doc/draft-lcurley-warp/).

## Install

To install dependencies:

```
npm install
```

## Build

To generate the builds:

```
npm run build
```

Generated builds:

- **IIFE:** `dist/moq-player.iife.js` & `dist/moq-simple-player.iife.js` – for direct browser usage via `<script>` tags.
- **ESM:** `dist/moq-player.esm.js` & `dist/moq-simple-player.esm.js` – for module-based usage in modern bundlers.
- **Type Definitions:** `dist/types/moq-player.d.ts` – TypeScript declarations for type-safe development.

## Develop

To start the development build process (with Rollup):

```
npm run dev
```

This builds the library continuously as you make changes.

## License

Licensed under either:

- Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)
