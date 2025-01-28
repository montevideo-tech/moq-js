<p align="center">
  <img height="128px" src="https://github.com/englishm/moq-js/blob/main/.github/logo.svg" alt="Media over QUIC">
</p>

# Media over QUIC (MoQ) Player

Media over QUIC (MoQ) is a live media delivery protocol utilizing QUIC streams.
See the [MoQ working group](https://datatracker.ietf.org/wg/moq/about/) for more information.

This repository provides a **web library for MoQ**. It uses browser APIs such as **WebTransport** and **WebCodecs** to support both contribution and distribution over MoQ.

> **Note**: This library currently focuses on the **client side**. You’ll need a MoQ server or relay, such as [moq-rs](https://github.com/englishm/moq-rs) (for local usage).

This library offers **two main approaches** to playing MoQ streams in a browser:

1. **Web Component** – `<video-moq>` with simple built-in controls.
2. **Simple Player** – A `Player` class that handles rendering and playback logic without built-in UI.

---

## Installation

Install the library from npm:

```bash
npm install moq-player
```

Or include via a `<script>` tag (for the IIFE build):

```html
<script src="https://cdn.jsdelivr.net/npm/package@latest/dist/moq-player.iife.js"></script>
```

## Usage

### Web Component: `<video-moq>`

```html
<video-moq
	src="https://example.com/my-moq-stream?namespace=demo"
	fingerprint="https://example.com/fingerprint"
	width="640"
	muted
	controls
></video-moq>
```

The built-in controls are basic. If you want more advanced controls or custom styling, see the [Styling & Media Chrome](#styling--media-chrome) section or our samples.

### Simple Player

If you’d prefer to implement your own UI or integrate the player logic differently, use the class-based Player:

```javascript
import { Player } from "moq-player";

async function initPlayer() {
	const canvas = document.getElementById("my-canvas");
	const player = await Player.create({
		url: "https://example.com/my-moq-stream",
		fingerprint: "https://example.com/fingerprint",
		namespace: "demo",
		canvas,
	});

	player.play();
	// Implement your own play/pause buttons, volume sliders, etc.
}
```

## Events

Both the Web Component and the Class-Based Player emit a series of events to help track playback state:

- `play`
- `pause`
- `loadeddata`
- `volumechange`
- `unsubscribestared`
- `unsubscribedone`
- `subscribestared`
- `subscribedone`
- `waitingforkeyframe`
- `timeupdate`

You can listen to these events in the usual way. For example:

```javascript
const videoMoq = document.querySelector("video-moq");
videoMoq.addEventListener("play", () => {
	console.log("Playback started!");
});
```

See `samples/event-handling` for complete examples.

## Styling & Media Chrome

When using the `<video-moq>` element, you can style it in various ways:

- **Media Chrome:** Integrate `<video-moq>` inside a `<media-controller>` and use `<media-play-button>`, `<media-time-range>`, and other controls. See `samples/media-chrome` for an example.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/media-chrome@4/+esm"></script>
<media-controller>
	<video-moq slot="media" src="..." controls></video-moq>
	<media-play-button></media-play-button>
	<media-mute-button></media-mute-button>

	<!-- more controls... -->
</media-controller>
```

- **player.style:** You can also use custom themes from [player.style](https://player.style/) to style the player. See `samples/media-chrome` for a working example.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/player.style/x-mas/+esm"></script>
<media-theme-x-mas>
	<video-moq
		src="https://localhost:4443?namespace=bbb"
		fingerprint="https://localhost:4443/fingerprint"
		width="640px"
		slot="media"
	></video-moq>
</media-theme-x-mas>
```

## Samples

The `samples/` directory demonstrates:

- **Web Component Basic** – A simple `<video-moq>` usage.
- **Web Component Advanced** – Using the component as an ES module.
- **Media Chrome** – Integrating `<video-moq>` with [player.style](https://player.style/) custom themes.
- **Simple Player** – Using the class-based Player without built-in controls.
- **Event Handling** – Listening for playback and subscription events in detail.

## Development

- Install dependencies

```
npm install
```

- Run the dev server for local testing:

```bash
npm run dev
```

In [localhost:3000](http://localhost:3000/) you will have the samples running.

## License

Licensed under either:

- Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

## Community & Support

- Join our [Discord](https://discord.gg/FCYF3p99mr) for updates and discussion.
- File issues or suggestions via GitHub Issues.
- Pull requests are welcome!
