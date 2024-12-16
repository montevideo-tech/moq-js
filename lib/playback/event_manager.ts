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

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class EventManagerFactory {
	private static eventManagers: EventManagerMap = {}

	static getEventManager(canvas: OffscreenCanvas): EventManager {
		const key = this.getUniqueCanvasKey(canvas)
		console.error("Pidieron la lista de eventos")
		console.error("Key: ", key)
		console.error("Antes: ", this.eventManagers)
		if (!this.eventManagers[key]) {
			this.eventManagers[key] = new EventManager()
			console.error("Despues: ", this.eventManagers)
		}
		return this.eventManagers[key]
	}

	private static canvasIdMap: WeakMap<OffscreenCanvas, string>
	private static canvasIdCounter = 1

	static getUniqueCanvasKey(canvas: OffscreenCanvas): string {
		console.error("week map: ", this.canvasIdMap)
		if (!this.canvasIdMap) {
			this.canvasIdMap = new WeakMap<OffscreenCanvas, string>()
		}
		if (!this.canvasIdMap.has(canvas)) {
			console.error("Se creo una nueva key")
			this.canvasIdMap.set(canvas, `canvas-${this.canvasIdCounter++}`)
		}
		return this.canvasIdMap.get(canvas)!
	}
}
