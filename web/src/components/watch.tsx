/* eslint-disable jsx-a11y/media-has-caption */
import { Player } from "@kixelated/moq/playback"
import Fail from "./fail"
import { createEffect, createMemo, createSignal, onCleanup, Show } from "solid-js"
import { VolumeButton } from "./volume"
import { PlayButton } from "./play-button"

export default function Watch(props: { name: string }) {
	// Use query params to allow overriding environment variables.
	const urlSearchParams = new URLSearchParams(window.location.search)
	const params = Object.fromEntries(urlSearchParams.entries())
	const server = params.server ?? import.meta.env.PUBLIC_RELAY_HOST
	let tracknum: number = Number(params.track ?? 0)
	let canvas!: HTMLCanvasElement

	const [error, setError] = createSignal<Error | undefined>()
	const [player, setPlayer] = createSignal<Player | undefined>()
	const [showCatalog, setShowCatalog] = createSignal(false)

	const [options, setOptions] = createSignal<string[]>([])
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
		const playerInstance = player()
		if (!playerInstance) return

		onCleanup(() => playerInstance.close())
		playerInstance.closed().then(setError).catch(setError)
	})

	const play = () => {
		player()?.play().catch(setError)
	}

	const mute = (state: boolean) => {
		player()?.mute(state).catch(setError)
	}

	// The JSON catalog for debugging.
	const catalog = createMemo(() => {
		const playerInstance = player()
		if (!playerInstance) return

		const catalog = playerInstance.getCatalog()
		return JSON.stringify(catalog, null, 2)
	})

	function updateURLWithTracknumber(trackIndex: number) {
		const url = new URL(window.location.href)
		url.searchParams.set("track", trackIndex.toString())
		window.history.replaceState({}, "", decodeURIComponent(url.toString()))
	}

	createEffect(() => {
		const playerInstance = player()
		if (!playerInstance) return

		const videotracks = playerInstance.getVideoTracks()
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
		void player()?.switchTrack(selectedTrack)

		const videotracks = options()
		const trackIndex = videotracks.indexOf(selectedTrack)
		tracknum = trackIndex

		if (trackIndex !== -1) {
			updateURLWithTracknumber(trackIndex)
		}
	}

	// NOTE: The canvas automatically has width/height set to the decoded video size.
	// TODO shrink it if needed via CSS
	return (
		<>
			<Fail error={error()} />
			<div class="relative aspect-video w-full">
				<canvas ref={canvas} onClick={play} class="h-full w-full rounded-lg" />
				<PlayButton play={play} />
				<VolumeButton mute={mute} />
			</div>
			<div class="mt-4 flex flex-col space-y-4">
				<div class="flex items-center space-x-4">
					<select value={selectedOption() ?? ""} onChange={handleOptionSelectChange}>
						{options()?.length ? (
							options().map((option) => <option value={option}>{option}</option>)
						) : (
							<option disabled>No options available</option>
						)}
					</select>
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
