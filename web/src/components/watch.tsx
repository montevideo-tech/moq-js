/* eslint-disable jsx-a11y/media-has-caption */
import { Player } from "@kixelated/moq/playback"

import Fail from "./fail"

import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js"

export default function Watch(props: { name: string }) {
	// Use query params to allow overriding environment variables.
	const urlSearchParams = new URLSearchParams(window.location.search)
	const params = Object.fromEntries(urlSearchParams.entries())
	const server = params.server ?? import.meta.env.PUBLIC_RELAY_HOST
	let tracknum: number = Number(params.track ?? 0)

	const [error, setError] = createSignal<Error | undefined>()

	let canvas!: HTMLCanvasElement

	const [usePlayer, setPlayer] = createSignal<Player | undefined>()
	const [showCatalog, setShowCatalog] = createSignal(false)

	const [options, setOptions] = createSignal<string[]>([])
	const [mute, setMute] = createSignal<boolean>(false)
	const [selectedOption, setSelectedOption] = createSignal<string | undefined>()

	createEffect(() => {
		const namespace = props.name
		const url = `https://${server}`

		// Special case localhost to fetch the TLS fingerprint from the server.
		// TODO remove this when WebTransport correctly supports self-signed certificates
		const fingerprint = server.startsWith("localhost") ? `https://${server}/fingerprint` : undefined

		Player.create({ url, fingerprint, canvas, namespace }, tracknum).then(setPlayer).catch(setError)
	})

	createEffect(() => {
		const player = usePlayer()
		if (!player) return

		onCleanup(() => player.close())
		player.closed().then(setError).catch(setError)
	})

	const play = () => {
		usePlayer()?.play().catch(setError)
	}

	const handlePlayPause = async () => {
		const player = usePlayer();
		if (!player) return;

		try {
		  await player.play();
		} catch (error) {
		  setError();
		}
	  };

	// The JSON catalog for debugging.
	const catalog = createMemo(() => {
		const player = usePlayer()
		if (!player) return

		const catalog = player.getCatalog()
		return JSON.stringify(catalog, null, 2)
	})

	function updateURLWithTracknumber(trackIndex: number) {
		const url = new URL(window.location.href)
		url.searchParams.set("track", trackIndex.toString())
		window.history.replaceState({}, "", decodeURIComponent(url.toString()))
	}

	createEffect(() => {
		const player = usePlayer()
		if (!player) return

		const videotracks = player.getVideoTracks()
		setOptions(videotracks)

		if (tracknum >= 0 && tracknum < videotracks.length) {
			const selectedTrack = videotracks[tracknum]
			setSelectedOption(selectedTrack)
			updateURLWithTracknumber(tracknum)
		}
	})

	const handleOptionSelectChange = (event: Event) => {
		const selectedTrack = (event.target as HTMLSelectElement).value
		setSelectedOption(selectedTrack)
		void usePlayer()?.switchTrack(selectedTrack)

		const videotracks = options()
		const trackIndex = videotracks.indexOf(selectedTrack)
		tracknum = trackIndex

		if (trackIndex !== -1) {
			updateURLWithTracknumber(trackIndex)
		}
	}

	const handleMuteChange = (event: Event) => {
		const muteValue = (event.target as HTMLInputElement).checked

		setMute(muteValue)
		void usePlayer()?.mute(muteValue)
	}

	// NOTE: The canvas automatically has width/height set to the decoded video size.
	// TODO shrink it if needed via CSS
	return (
		<>
			<Fail error={error()} />
			<canvas ref={canvas} onClick={play} class="aspect-video w-full rounded-lg" />
			<div class="mt-4 flex flex-col space-y-4">
				<div class="flex items-center space-x-4">
					<select value={selectedOption() ?? ''} onChange={handleOptionSelectChange}>
						{options()?.length ? (
							options().map((option) => <option value={option}>{option}</option>)
						) : (
							<option disabled>No options available</option>
						)}
					</select>
					<label class="flex items-center space-x-2">
						<input type="checkbox" checked={mute()} onChange={handleMuteChange} />
						<span>Mute</span>
					</label>
					<button onClick={handlePlayPause}>{"Play/Pause"}</button>
				</div>
			</div>
			<h3>Debug</h3>
			<Show when={catalog()}>
				<div class="mt-2 flex">
					<button onClick={() => setShowCatalog((prev) => !prev)}>
						{showCatalog() ? "Hide Catalog" : "Show Catalog"}
					</button>
				</div>
				<Show when={showCatalog()}>
					<pre>{catalog()}</pre>
				</Show>
			</Show>
		</>
	)
}
