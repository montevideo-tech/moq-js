import { createSignal } from "solid-js"

type VolumeButtonProps = {
	mute: (isMuted: boolean) => void
}

export const VolumeButton = (props: VolumeButtonProps) => {
	const [isMuted, setIsMuted] = createSignal(false)

	const toggleMute = () => {
		const newIsMuted = !isMuted()
		setIsMuted(newIsMuted)
		props?.mute(newIsMuted)
	}

	return (
		<button
			class="
				flex h-4 w-0 items-center justify-center rounded bg-transparent
				p-4 text-white hover:bg-black/80
				focus:bg-black/80 focus:outline-none
			"
			onClick={toggleMute}
			aria-label={isMuted() ? "Unmute" : "Mute"}
		>
			{isMuted() ? "🔇" : "🔊"}
		</button>
	)
}
