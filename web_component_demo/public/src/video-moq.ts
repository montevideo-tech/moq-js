class VideoMoq extends HTMLElement {
	private shadow: ShadowRoot;
	private audioElement: HTMLAudioElement;
	private playButton: HTMLButtonElement;
	private pauseButton: HTMLButtonElement;
	private progressBar: HTMLInputElement;

	constructor() {
		super();

		// Attach Shadow DOM
		this.shadow = this.attachShadow({ mode: "open" });
		this.shadow.innerHTML = `
			<style>
				:host {
					display: inline-block;
					font-family: Arial, sans-serif;
					border: 1px solid #ccc;
					border-radius: 5px;
					padding: 10px;
					width: 300px;
				}

				.player {
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.progress {
					flex: 1;
				}

				button {
					background-color: #007bff;
					color: white;
					border: none;
					border-radius: 3px;
					padding: 5px 10px;
					cursor: pointer;
				}

				button:disabled {
					background-color: #ccc;
				}

				button:hover:not(:disabled) {
					background-color: #0056b3;
				}
			</style>
			<div class="player">
				<button id="play">Play</button>
				<button id="pause" disabled>Pause</button>
				<input id="progress" type="range" class="progress" min="0" max="100" value="0">
			</div>
		`;

		this.audioElement = document.createElement("audio");
		this.playButton = this.shadow.querySelector("#play")!;
		this.pauseButton = this.shadow.querySelector("#pause")!;
		this.progressBar = this.shadow.querySelector("#progress")!;

		// Bind event listeners
		this.playButton.addEventListener("click", this.playAudio.bind(this));
		this.pauseButton.addEventListener("click", this.pauseAudio.bind(this));
		this.progressBar.addEventListener("input", this.seekAudio.bind(this));
	}

	// connectedCallback: Called when the element is first added to the DOM
	// disconnectedCallback: Called when the element is removed from the DOM
	// attributeChangedCallbackCalled when one of the element's watched attributes change. For an attribute to be watched, you must add it to the component class's static observedAttributes property.

	// src
	// width
	// height
	// controls
	// autoplay
	// muted
	// poster
	connectedCallback() {
		const src = this.getAttribute("src");
		if (src) {
			this.audioElement.src = src;
			this.audioElement.addEventListener("timeupdate", this.updateProgress.bind(this));
			this.audioElement.addEventListener("ended", this.onAudioEnded.bind(this));
		} else {
			console.error("No 'src' attribute provided for <player-component>");
		}
	}

	// Play the audio
	private playAudio() {
		this.audioElement.play();
		this.playButton.disabled = true;
		this.pauseButton.disabled = false;
	}

	// Pause the audio
	private pauseAudio() {
		this.audioElement.pause();
		this.playButton.disabled = false;
		this.pauseButton.disabled = true;
	}

	// Update progress bar
	private updateProgress() {
		const progress = (this.audioElement.currentTime / this.audioElement.duration) * 100;
		this.progressBar.value = progress.toString();
	}

	// Seek the audio
	private seekAudio() {
		const progress = parseFloat(this.progressBar.value);
		this.audioElement.currentTime = (progress / 100) * this.audioElement.duration;
	}

	// Handle audio ended event
	private onAudioEnded() {
		this.playButton.disabled = false;
		this.pauseButton.disabled = true;
		this.progressBar.value = "0";
	}

	// Called when the element is removed from the DOM
	disconnectedCallback() {
		this.playButton.removeEventListener("click", this.playAudio);
		this.pauseButton.removeEventListener("click", this.pauseAudio);
		this.progressBar.removeEventListener("input", this.seekAudio);
	}
}

// Register the custom element
customElements.define("player-component", VideoMoq);
export default VideoMoq;
