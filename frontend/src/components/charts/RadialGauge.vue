<script setup>
import { ref, computed, watch } from 'vue'
import { useGaugeAnimation } from '@/composables/useGaugeAnimation'

const props = defineProps({
	value: { type: Number, default: 0 },
	min: { type: Number, default: 0 },
	max: { type: Number, default: 100 },
	unit: { type: String, default: '' },
	label: { type: String, default: '' },
	size: { type: Number, default: 200 },
	thickness: { type: Number, default: 20 },
	color: { type: String, default: 'var(--neon-cyan)' },
	type: { type: String, default: 'full' },
	showNeedle: { type: Boolean, default: true },
	zones: { type: Array, default: () => [] }
})

const targetValue = ref(props.value)
const animatedValue = useGaugeAnimation(targetValue, { duration: 600, easing: 'back' })

watch(() => props.value, (newValue) => {
	targetValue.value = newValue
})

const percentage = computed(() => {
	const range = props.max - props.min
	return ((animatedValue.value - props.min) / range) * 100
})

const rotation = computed(() => {
	if (props.type === 'semi') {
		return -90 + (percentage.value / 100) * 180
	}
	return -90 + (percentage.value / 100) * 360
})

const arcPath = computed(() => {
	const centerX = props.size / 2
	const centerY = props.size / 2
	const radius = (props.size - props.thickness) / 2

	if (props.type === 'semi') {
		const startAngle = -180
		const endAngle = 0
		return describeArc(centerX, centerY, radius, startAngle, endAngle)
	} else {
		return `M ${centerX},${centerY} m -${radius},0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 -${radius * 2},0`
	}
})

const progressPath = computed(() => {
	const centerX = props.size / 2
	const centerY = props.size / 2
	const radius = (props.size - props.thickness) / 2

	if (props.type === 'semi') {
		const startAngle = -180
		const endAngle = -180 + (percentage.value / 100) * 180
		return describeArc(centerX, centerY, radius, startAngle, endAngle)
	} else {
		const angle = (percentage.value / 100) * 360
		return describeArc(centerX, centerY, radius, -90, -90 + angle)
	}
})

const describeArc = (x, y, radius, startAngle, endAngle) => {
	const start = polarToCartesian(x, y, radius, endAngle)
	const end = polarToCartesian(x, y, radius, startAngle)
	const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

	return [
		'M', start.x, start.y,
		'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
	].join(' ')
}

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
	const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	}
}

const currentColor = computed(() => {
	if (props.zones.length === 0) return props.color

	for (const zone of props.zones) {
		if (animatedValue.value >= zone.min && animatedValue.value <= zone.max) {
			return zone.color
		}
	}
	return props.color
})
</script>

<template>
	<div :class="$style.gaugeContainer">
		<svg :width="size" :height="type === 'semi' ? size / 2 + 40 : size" :viewBox="`0 0 ${size} ${type === 'semi' ? size / 2 + 40 : size}`">
			<path
				:d="arcPath"
				fill="none"
				stroke="rgba(255, 255, 255, 0.1)"
				:stroke-width="thickness"
				stroke-linecap="round"
			/>

			<path
				:d="progressPath"
				fill="none"
				:stroke="currentColor"
				:stroke-width="thickness"
				stroke-linecap="round"
				:class="$style.progressArc"
				:style="{ filter: `drop-shadow(0 0 8px ${currentColor})` }"
			/>

			<g v-if="showNeedle && type === 'semi'" :transform="`translate(${size / 2}, ${size / 2})`">
				<line
					x1="0"
					y1="0"
					:x2="(size - thickness) / 2 - 10"
					y2="0"
					:stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					:transform="`rotate(${rotation})`"
					:class="$style.needle"
				/>
				<circle cx="0" cy="0" r="6" :fill="currentColor" />
			</g>
		</svg>

		<div :class="$style.gaugeValue">
			<Text :size="size > 150 ? '32' : '24'" weight="700" :color="currentColor.includes('var') ? 'primary' : null" :style="{ color: currentColor.includes('var') ? null : currentColor }" mono>
				{{ Math.round(animatedValue) }}
			</Text>
			<Text size="12" weight="600" color="tertiary">{{ unit }}</Text>
			<Text v-if="label" size="10" weight="600" color="support" style="margin-top: 4px;">{{ label }}</Text>
		</div>
	</div>
</template>

<style module>
.gaugeContainer {
	position: relative;
	display: inline-block;
}

.progressArc {
	transition: stroke 0.3s ease;
}

.needle {
	transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.gaugeValue {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	pointer-events: none;
}
</style>
