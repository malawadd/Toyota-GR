import { ref, watch, onUnmounted } from 'vue'

export function useCountUp(target, duration = 1000) {
	const current = ref(0)
	let animationFrame = null
	let startTime = null
	let startValue = 0

	const easeOutQuad = (t) => t * (2 - t)

	const animate = (timestamp) => {
		if (!startTime) startTime = timestamp
		const elapsed = timestamp - startTime
		const progress = Math.min(elapsed / duration, 1)

		const easedProgress = easeOutQuad(progress)
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
