type PlayButtonProps = {
	play: () => void
}

export const PlayButton = (props: PlayButtonProps) => {
	return (
		<button
			class="
				absolute bottom-4 left-4 flex h-4 w-8 items-center justify-center
				rounded bg-black/70 px-6 py-4 shadow-lg
				hover:bg-black/80 focus:bg-black/100 focus:outline-none
			"
			onClick={() => props.play()}
			aria-label="Play"
		>
			▶
		</button>
	)
}
