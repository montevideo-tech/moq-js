export default class EventManager {
	#target?: EventTarget

	constructor(target?: EventTarget) {
		this.#target = target
	}

	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	) {
		if (!this.#target) {
			throw new Error("target is not defined")
		}
		this.#target.addEventListener(type, listener, options)
	}

	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	) {
		if (!this.#target) {
			throw new Error("target is not defined")
		}
		this.#target.removeEventListener(type, listener, options)
	}

	dispatchEvent(event: Event) {
		if (!this.#target) {
			throw new Error("target is not defined")
		}
		return this.#target.dispatchEvent(event)
	}

	attachTarget(target: EventTarget) {
		this.#target = target
	}
}

type EventManagerMap = { [id: string]: EventManager }

export const EventManagerFactory = {
	eventManagers: {} as EventManagerMap,
	canvasIdMap: new WeakMap<OffscreenCanvas, string>(),
	canvasIdCounter: 1,

	getEventManager(canvas: OffscreenCanvas): EventManager {
		const key = this.getUniqueCanvasKey(canvas)
		if (!this.eventManagers[key]) {
			this.eventManagers[key] = new EventManager()
		}
		return this.eventManagers[key]
	},

	getUniqueCanvasKey(canvas: OffscreenCanvas): string {
		if (!this.canvasIdMap.has(canvas)) {
			this.canvasIdMap.set(canvas, `canvas-${this.canvasIdCounter++}`)
		}
		return this.canvasIdMap.get(canvas)!
	},
}
