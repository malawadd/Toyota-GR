import { ref, watch, onUnmounted } from 'vue'

export function useGaugeAnimation(target, options = {}) {
	const {
		duration = 800,
		easing = 'elastic'
	} = options

	const current = ref(0)
	let animationFrame = null
	let startTime = null
	let startValue = 0

	const easeOutElastic = (t) => {
		const p = 0.3
		return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
	}

	const easeOutBack = (t) => {
		const c1 = 1.70158
		const c3 = c1 + 1
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
	}

	const easeOutQuad = (t) => t * (2 - t)

	const getEasing = () => {
		switch (easing) {
			case 'elastic':
				return easeOutElastic
			case 'back':
				return easeOutBack
			case 'quad':
			default:
				return easeOutQuad
		}
	}

	const animate = (timestamp) => {
		if (!startTime) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / duration, 1)

		const easingFunction = getEasing()
		const easedProgress = easingFunction(progress)
		current.value = startValue + (target.value - startValue) * easedProgress

		if (progress < 1) {
			animationFrame = requestAnimationFrame(animate)
		} else {
			current.value = target.value
		}
	}

	const start = () => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame)
		}
		startValue = current.value
		startTime = null
		animationFrame = requestAnimationFrame(animate)
	}

	watch(target, () => {
		start()
	}, { immediate: true })

	onUnmounted(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame)
		}
	})

	return current
}
