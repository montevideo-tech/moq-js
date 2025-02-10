import Player from "../playback/index"
import { FULLSCREEN_BUTTON, PICTURE_IN_PICTURE_BUTTON, VOLUME_CONTROL } from "./control-buttons"
import { ENTER_PIP_SVG, EXIT_PIP_SVG, PAUSE_SVG, PLAY_SVG } from "./icons"

/**
 * This stylesheet is self contained within the shadow root
 * If we attach the element as open in the constructor, it should inherit
 * the document's style.
 */
import STYLE_SHEET from "./video-moq.css"

export class VideoMoq extends HTMLElement {
	private shadow: ShadowRoot

	// Event Handlers
	private playPauseEventHandler: (event: Event) => void
	private onMouseEnterHandler: (event: Event) => void
	private onMouseLeaveHandler: (event: Event) => void
	private toggleMuteEventHandler: (event: Event) => void
	private setVolume: (event: Event) => void
	private toggleShowTrackEventHandler: (event: Event) => void
	private toggleFullscreenEventHandler: (event: Event) => void
	private togglePictureInPictureEventHandler: (event: Event) => void

	// HTML Elements
	#base?: HTMLDivElement
	#canvas?: HTMLCanvasElement
	#playButton?: HTMLButtonElement
	#controls?: HTMLElement
	#volumeButton?: HTMLButtonElement
	#volumeRange?: HTMLInputElement
	#trackButton?: HTMLButtonElement
	#trackList?: HTMLUListElement
	#fullscreenButton?: HTMLButtonElement
	#pipButton?: HTMLButtonElement
	#pipWindow?: WindowWithPiP

	// State
	private player: Player | null = null
	private previousVolume: number = 1

	get src(): string | null {
		return this.getAttribute("src")
	}

	set src(val) {
		this.setAttribute("src", `${val}`)
	}

	get controls(): string | null {
		return this.getAttribute("controls")
	}

	set controls(val) {
		this.setAttribute("controls", `${val}`)
	}

	get muted(): boolean {
		return this.player ? this.player.muted : false
	}

	set muted(mute: boolean) {
		if (mute) {
			this.mute().catch((err) => {
				console.error("Error muting:", err)
			})
			this.dispatchEvent(new Event("volumechange"))
		} else {
			this.unmute().catch((err) => {
				console.error("Error unmuting:", err)
			})
			this.dispatchEvent(new Event("volumechange"))
		}
	}

	get fullscreen(): boolean {
		return document.fullscreenElement === this.#base
	}

	set fullscreen(fullscreen: boolean) {
		if (fullscreen) {
			this.requestFullscreen().catch((err) => {
				console.error("Error entering fullscreen:", err)
			})
		} else {
			this.exitFullscreen().catch((err) => {
				console.error("Error exiting fullscreen:", err)
			})
		}
	}

	get pictureInPictureActive(): boolean {
		return this.#pipWindow !== undefined
	}

	get trackNum(): string | null {
		return this.getAttribute("trackNum")
	}

	set trackNum(val) {
		this.setAttribute("trackNum", `${val}`)
	}

	get selectedTrack(): string {
		return this.player ? this.player.videoTrackName : ""
	}

	/*
		HTMLMediaElement's error is of type MediaError, but it only allows read only code and message
		We could extend it, but it does not seem worth it.
	*/
	public error: Error | null = null

	constructor() {
		super()

		// Attach Shadow DOM
		this.shadow = this.attachShadow({ mode: "open" })

		// Bind event listeners to add and remove from lists.
		this.playPauseEventHandler = () => {
			this.togglePlayPause().catch((err) => {
				console.error("Error toggling play/pause:", err)
			})
		}

		this.toggleMuteEventHandler = () => {
			this.toggleMute().catch((err) => {
				console.error("Error toggling mute:", err)
			})
		}

		this.togglePictureInPictureEventHandler = () => {
			this.requestPictureInPicture().catch((err) => {
				console.error("Error toggling picture-in-picture: ", err)
			})
		}

		this.setVolume = (e: Event) => {
			this.handleVolumeChange(e as Event & { currentTarget: HTMLInputElement }).catch((err) => {
				console.error("Error setting volume: ", err)
			})
		}

		this.onMouseEnterHandler = this.toggleShowControls.bind(this, true)
		this.onMouseLeaveHandler = this.toggleShowControls.bind(this, false)
		this.toggleShowTrackEventHandler = this.toggleShowTracks.bind(this)
		this.toggleFullscreenEventHandler = this.toggleFullscreen.bind(this)
		this.onFullscreenChange = this.onFullscreenChange.bind(this)
	}

	/**
	 * Called when the element is first added to the DOM
	 *
	 * Here we handle attributes.
	 * Right now we support: src fingerprint controls namespace width height
	 * TODO: To be supported: autoplay muted poster
	 * @returns
	 */
	connectedCallback() {
		this.load()
	}

	/**
	 * Called when the element is removed from the DOM
	 * */
	disconnectedCallback() {
		this.destroy().catch((error) => {
			console.error("Error while destroying:", error)
		})
	}

	// Called when one of the element's watched attributes change. For an attribute to be watched, you must add it to the component class's static observedAttributes property.
	// attributeChangedCallback() {}

	/**
	 * Sets the player attribute and configures info related to a successful connection
	 * */
	private setPlayer(player: Player) {
		this.player = player

		this.player.addEventListener("play", () => this.dispatchEvent(new Event("play")))
		this.player.addEventListener("pause", () => this.dispatchEvent(new Event("pause")))
		this.player.addEventListener("loadeddata", () => this.dispatchEvent(new Event("loadeddata")))
		this.player.addEventListener("volumechange", () => this.dispatchEvent(new Event("volumechange")))
		this.player.addEventListener("timeupdate", () => {
			const event = new CustomEvent("timeupdate", {
				detail: { currentTime: this.player?.getCurrentTime() },
			})
			this.dispatchEvent(event)
		})
		this.player.addEventListener("error", (e) => this.dispatchEvent(new CustomEvent("error", { detail: e })))

		if (!this.player.isPaused() && this.#playButton) {
			this.#playButton.innerHTML = PAUSE_SVG
			this.#playButton.ariaLabel = "Pause"

			// TODO: Seems like I have to wait till subscriptions are done to automute and/or autoplay
			// const automute = this.getAttribute("muted");
			// if (automute !== null && automute) {
			// 	this.mute();
			// }

			// Correct the icon if not muted
			if (!this.muted && this.#volumeButton) {
				this.#volumeButton.ariaLabel = "Mute"
				this.#volumeButton.innerText = "🔊"
			}
		}
	}

	private load() {
		this.destroy().catch((error) => {
			console.error("Error while destroying:", error)
		})

		this.shadow.innerHTML = /*html*/ `
			<style>${STYLE_SHEET}</style>
			<div id="base">
				<div id="error"></div>
				<canvas id="canvas" class="h-full w-full">
				</canvas>
			</div>
		`

		this.#base = this.shadow.querySelector("#base")!
		this.#canvas = this.shadow.querySelector("canvas#canvas")!

		const width = this.parseDimension(this.getAttribute("width"), -1)
		const height = this.parseDimension(this.getAttribute("height"), -1)

		if (width != -1) {
			this.#base.style.width = width.toString() + "px"
		}
		if (height != -1) {
			this.#base.style.height = height.toString() + "px"
		}
		const aspectRatio = this.getAttribute("aspectRatio")
		if (aspectRatio !== null) {
			this.#base.style.aspectRatio = aspectRatio.toString()
		}

		if (!this.src) {
			this.fail(new Error("No 'src' attribute provided for &lt;video-moq&gt;"))
			return
		}

		const url = new URL(this.src)

		const urlParams = new URLSearchParams(url.search)
		const namespace = urlParams.get("namespace") || this.getAttribute("namespace")
		const fingerprint = urlParams.get("fingerprint") || this.getAttribute("fingerprint")

		// TODO: Unsure if fingerprint should be optional
		if (namespace === null || fingerprint === null) return

		const trackNumStr = urlParams.get("trackNum") || this.trackNum
		const trackNum: number = this.auxParseInt(trackNumStr, 0)
		Player.create({ url: url.origin, fingerprint, canvas: this.#canvas, namespace }, trackNum)
			.then((player) => this.setPlayer(player))
			.catch((e) => this.fail(e))

		if (this.controls !== null) {
			const controlsElement = document.createElement("div")
			controlsElement.innerHTML = /* html */ `
			<div id="controls" class="absolute opacity-0 bottom-4 flex h-[40px] w-full items-center gap-[4px] rounded transition-opacity duration-200" >
				<button id="play" class="absolute bottom-0 left-4 flex h-8 w-12 items-center justify-center rounded bg-black-70 px-2 py-2 shadow-lg hover:bg-black-80 focus:bg-black-100 focus:outline-none">
					${PLAY_SVG}
				</button>
				<div class="absolute bottom-0 right-4 flex h-[32px] w-fit items-center justify-evenly gap-[4px] rounded bg-black-70 p-2">
					${VOLUME_CONTROL}
					<button id="track" aria-label="Select Track" class="flex h-4 w-0 items-center justify-center rounded bg-transparent p-4 text-white hover:bg-black-100 focus:bg-black-80 focus:outline-none">
						⚙️
					</button>
					<ul id="tracklist" class="absolute bottom-6 right-0 mt-2 w-40 rounded bg-black-80 p-0 text-white shadow-lg">
					</ul>
					${PICTURE_IN_PICTURE_BUTTON}
					${FULLSCREEN_BUTTON}
				</div>
			</div>`
			this.#base.appendChild(controlsElement.children[0])

			this.#controls = this.shadow.querySelector("#controls")!
			this.#playButton = this.shadow.querySelector("#play")!
			this.#volumeButton = this.shadow.querySelector("#volume")!
			this.#volumeRange = this.shadow.querySelector("#volume-range")!
			this.#trackButton = this.shadow.querySelector("#track")!
			this.#trackList = this.shadow.querySelector("ul#tracklist")!
			this.#fullscreenButton = this.shadow.querySelector("#fullscreen")!
			this.#pipButton = this.shadow.querySelector("#picture-in-picture")!

			this.#canvas.addEventListener("click", this.playPauseEventHandler)

			this.#playButton.addEventListener("click", this.playPauseEventHandler)

			this.#volumeButton.addEventListener("click", this.toggleMuteEventHandler)
			this.#volumeRange?.addEventListener("input", this.setVolume)

			this.#base.addEventListener("mouseenter", this.onMouseEnterHandler)
			this.#base.addEventListener("mouseleave", this.onMouseLeaveHandler)
			this.#canvas.addEventListener("mouseenter", this.onMouseEnterHandler)
			this.#canvas.addEventListener("mouseleave", this.onMouseLeaveHandler)
			this.#controls.addEventListener("mouseenter", this.onMouseEnterHandler)
			this.#controls.addEventListener("mouseleave", this.onMouseLeaveHandler)

			this.#trackButton.addEventListener("click", this.toggleShowTrackEventHandler)
			this.#fullscreenButton.addEventListener("click", this.toggleFullscreenEventHandler)
			this.#pipButton.addEventListener("click", this.togglePictureInPictureEventHandler)

			document.addEventListener("keydown", (e) => {
				if (e.key === "f") {
					this.toggleFullscreenEventHandler(e)
				}
			})
			document.addEventListener("fullscreenchange", () => this.onFullscreenChange())
		}
	}

	private async destroy() {
		this.#canvas?.removeEventListener("click", this.playPauseEventHandler)
		this.#playButton?.removeEventListener("click", this.playPauseEventHandler)

		this.#volumeButton?.removeEventListener("click", this.toggleMuteEventHandler)
		this.#volumeRange?.removeEventListener("input", this.setVolume)

		this.#canvas?.removeEventListener("mouseenter", this.onMouseEnterHandler)
		this.#canvas?.removeEventListener("mouseleave", this.onMouseLeaveHandler)
		this.#controls?.removeEventListener("mouseenter", this.onMouseEnterHandler)
		this.#controls?.removeEventListener("mouseleave", this.onMouseLeaveHandler)

		this.#trackButton?.removeEventListener("click", this.toggleShowTrackEventHandler)
		this.#fullscreenButton?.removeEventListener("click", this.toggleFullscreenEventHandler)
		this.#pipButton?.removeEventListener("click", this.togglePictureInPictureEventHandler)

		document.removeEventListener("keydown", this.toggleFullscreenEventHandler)
		document.removeEventListener("fullscreenchange", () => this.onFullscreenChange())

		if (!this.player) return
		await this.player.close()
		this.player = null
	}

	private toggleShowControls(show: boolean) {
		if (!this.#controls) return
		if (show) {
			this.#controls.classList.add("opacity-100")
			this.#controls.classList.remove("opacity-0")
		} else {
			this.#controls.classList.add("opacity-0")
			this.#controls.classList.remove("opacity-100")
		}
	}

	// Play / Pause
	private async togglePlayPause() {
		if (!this.#playButton) return

		this.#playButton.disabled = true

		try {
			if (!this.player) return

			if (this.player.isPaused()) {
				await this.play()
			} else {
				await this.pause()
			}
		} catch (error) {
			console.error("Error toggling play/pause:", error)
		} finally {
			if (this.#playButton) {
				this.#playButton.disabled = false
			}
		}
	}

	public play(): Promise<void> {
		return this.player
			? this.player.play().then(() => {
					if (!this.#playButton) return
					this.#playButton.innerHTML = PAUSE_SVG
					this.#playButton.ariaLabel = "Pause"
				})
			: Promise.resolve()
	}

	public pause(): Promise<void> {
		return this.player
			? this.player.pause().then(() => {
					if (!this.#playButton) return
					this.#playButton.innerHTML = PLAY_SVG
					this.#playButton.ariaLabel = "Play"
				})
			: Promise.resolve()
	}

	get paused(): boolean {
		return this.player ? this.player.isPaused() : false
	}

	private async toggleMute() {
		if (!this.#volumeButton) return
		this.#volumeButton.disabled = true
		try {
			if (this.muted) {
				await this.unmute()
			} else {
				await this.mute()
			}
		} catch (error) {
			console.error("Error toggling mute:", error)
		} finally {
			if (this.#volumeButton) {
				this.#volumeButton.disabled = false
			}
		}
	}

	public unmute(): Promise<void> {
		return this.player
			? this.player.mute(false).then(() => {
					if (!this.#volumeButton) return
					this.#volumeButton.ariaLabel = "Mute"
					this.#volumeButton.innerText = "🔊"
					this.#volumeRange!.value = this.previousVolume.toString()
				})
			: Promise.resolve()
	}

	public mute(): Promise<void> {
		return this.player
			? this.player.mute(true).then(() => {
					if (!this.#volumeButton) return
					this.#volumeButton.ariaLabel = "Unmute"
					this.#volumeButton.innerText = "🔇"
					this.previousVolume = parseFloat(this.#volumeRange!.value)
					this.#volumeRange!.value = "0"
				})
			: Promise.resolve()
	}

	private handleVolumeChange = async (e: Event & { currentTarget: HTMLInputElement }) => {
		const volume = parseFloat(e.currentTarget.value)
		if (volume === 0) {
			await this.mute()
		} else {
			await this.unmute()
		}

		this.#volumeRange!.value = volume.toString()
		await this.player?.setVolume(volume)
	}

	private toggleFullscreen() {
		this.fullscreen = !document.fullscreenElement
	}

	public async requestFullscreen(): Promise<void> {
		try {
			if (this.#base) {
				await this.#base.requestFullscreen()
			}
		} catch (error) {
			console.error("Error entering fullscreen:", error)
		}
	}

	public async exitFullscreen(): Promise<void> {
		try {
			await document.exitFullscreen()
		} catch (error) {
			console.error("Error exiting fullscreen:", error)
		}
	}

	private onFullscreenChange() {
		const isFullscreen = document.fullscreenElement !== null

		if (this.#fullscreenButton) {
			if (isFullscreen) {
				this.#fullscreenButton.innerHTML = "⇲"
				this.#fullscreenButton.ariaLabel = "Exit full screen"
			} else {
				this.#fullscreenButton.innerHTML = "⛶"
				this.#fullscreenButton.ariaLabel = "Full screen"
			}
		}
	}

	onLeavePictureinPicture() {
		console.log("onleave PiP")
	}

	public async enterPictureInPicture(): Promise<void> {
		console.log("request pip")

		if (!this.#canvas) {
			console.warn("Canvas element not found.")
			return
		}

		if (!this.#base) {
			console.warn("Base element not found.")
			return
		}

		this.#pipWindow =
			window.documentPictureInPicture &&
			(await window.documentPictureInPicture.requestWindow({
				width: 320,
				height: 180,
			}))

		if (!this.#pipWindow) {
			console.warn("Picture-in-Picture window not found.")
			return
		}

		// Move the canvas to the PiP window
		this.#pipWindow.document.body.append(this.#canvas)
		this.#canvas.style.width = "100%"
		this.#canvas.style.height = "100%"

		if (this.controls != null && this.#pipButton) {
			this.#pipButton.innerHTML = EXIT_PIP_SVG
		}

		const pipPlaceholder = document.createElement("div")
		pipPlaceholder.id = "pip-text"
		pipPlaceholder.textContent = "Picture-in-Picture Mode"
		pipPlaceholder.style.color = "black"
		pipPlaceholder.style.textAlign = "center"
		pipPlaceholder.style.marginTop = "10px"
		pipPlaceholder.style.width = "100%"
		pipPlaceholder.style.height = "100%"
		this.#base.appendChild(pipPlaceholder)

		this.#pipWindow?.addEventListener("pagehide", () => this.leavePictureInPicture())

		// this.#base.classList.add("pip-mode")

		console.log("request pip end")
	}

	public leavePictureInPicture() {
		console.log("exit Picture In Picture")
		if (this.#canvas && this.#base) {
			// Restore the canvas to the base element
			this.#base.append(this.#canvas)

			if (this.controls != null && this.#pipButton) {
				this.#pipButton.innerHTML = ENTER_PIP_SVG
			}

			this.#base.classList.remove("pip-mode")

			const pipText = this.#base.querySelector("#pip-text")
			if (pipText) {
				pipText.remove()
			}

			this.#pipWindow?.removeEventListener("pagehide", () => this.leavePictureInPicture())
			this.#pipWindow?.close()
			this.#pipWindow = undefined
		} else {
			console.warn("Failed to restore video element! Check DOM structure.")
		}
	}

	public async requestPictureInPicture() {
		console.log("request pip")

		if (!("documentPictureInPicture" in window)) {
			console.warn("DocumentPictureInPicture API is not supported.")
			return
		}

		try {
			if (!this.pictureInPictureActive) {
				await this.enterPictureInPicture()
			} else {
				this.leavePictureInPicture()
			}
		} catch (error) {
			console.error("Error toggling Picture-in-Picture:", error)
		}
	}

	#showTracks = false
	private toggleShowTracks() {
		if (!this.#trackList) return
		this.#showTracks = !this.#showTracks

		if (this.#showTracks) {
			if (this.player) {
				const options = this.player.getVideoTracks()
				this.#trackList.innerHTML = options
					.map((option) => {
						return /*html*/ `<li role="menuitem" tabIndex={0} data-name=${option}
				class="flex w-full items-center justify-between px-4 py-2 hover:bg-black-100 cursor-pointer
				 ${this.selectedTrack === option ? "bg-blue-500 text-white" : ""}"
				 >
				 <span>${option}</span>
				 </li>`
					})
					.join("")
				this.#trackList.querySelectorAll("li").forEach((element) => {
					element.addEventListener("click", () => {
						this.switchTrack(element.dataset.name || null).catch((error) => {
							console.error("Error switching track:", error)
						})
					})
					element.addEventListener("keydown", (e) => {
						if (e.key === "Enter" || e.key === " ") {
							this.switchTrack(element.dataset.name || null).catch((error) => {
								console.error("Error switching track:", error)
							})
						}
					})
				})
			} else {
				this.#trackList.innerHTML = /*html*/ `<li class="flex w-full items-center justify-between cursor-not-allowed px-4 py-2 text-gray-500"><span>No options available</span></li>`
			}
		} else {
			this.#trackList.innerHTML = ""
		}
	}

	private async switchTrack(name: string | null) {
		if (name === null) {
			this.error = new Error("Could not recognize selected track name")
			return
		}

		await this.player?.switchTrack(name)
	}

	private parseDimension(value: string | null, defaultValue: number): number {
		if (!value) {
			return defaultValue
		}

		const parsed = parseInt(value, 10)

		// Check for NaN or negative values
		if (isNaN(parsed) || parsed <= 0) {
			console.warn(`Invalid value "${value}" for dimension, using default: ${defaultValue}px`)
			return defaultValue
		}

		return parsed
	}

	/** Prints error and displays it in a red box */
	private fail(error?: Error) {
		console.error("Moq Player failed, please reload", error)

		this.error = error || new Error("Unknown error")

		const errorElement = this.shadow.querySelector("#error")

		if (errorElement) {
			errorElement.innerHTML = /*html*/ `<span class="font-bold">${this.error.name}:</span> ${this.error.message}`
		}
	}

	private auxParseInt(str: string | null, def: number): number {
		if (str == null) return def
		const res = parseInt(str)
		return isNaN(res) ? def : res
	}

	get duration(): number {
		if (this.player) return this.player.getCurrentTime()
		return 0
	}

	get currentTime(): number {
		if (this.player) return this.player.getCurrentTime()
		return 0
	}

	set currentTime(value: number) {
		if (value < this.duration) {
			console.warn("Seeking within the buffer is not supported in live mode.")
		}
	}

	get volume(): number {
		return this.player ? this.player.getVolume() : 0
	}

	set volume(value: number) {
		if (this.player) {
			void this.player.setVolume(value)
			this.dispatchEvent(new Event("volumechange"))
		}
	}
}

// Register the custom element
customElements.define("video-moq", VideoMoq)
export default VideoMoq
