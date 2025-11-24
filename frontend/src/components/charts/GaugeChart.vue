<script setup>
import { ref, onMounted, watch, defineProps, computed } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	value: {
		type: Number,
		required: true
	},
	min: {
		type: Number,
		default: 0
	},
	max: {
		type: Number,
		default: 100
	},
	label: {
		type: String,
		default: ''
	},
	unit: {
		type: String,
		default: ''
	},
	color: {
		type: String,
		default: 'var(--neon-lime)'
	}
})

const svgRef = ref(null)

const percentage = computed(() => {
	return ((props.value - props.min) / (props.max - props.min)) * 100
})

const drawGauge = () => {
	if (!svgRef.value) return

	const container = svgRef.value
	const size = Math.min(container.clientWidth, 200)
	const radius = size / 2 - 10

	d3.select(container).select('svg').remove()

	const svg = d3.select(container)
		.append('svg')
		.attr('width', size)
		.attr('height', size)

	const g = svg.append('g')
		.attr('transform', `translate(${size / 2},${size / 2})`)

	const arcBg = d3.arc()
		.innerRadius(radius - 20)
		.outerRadius(radius)
		.startAngle(-Math.PI / 2)
		.endAngle(Math.PI / 2)

	g.append('path')
		.attr('d', arcBg)
		.attr('fill', 'rgba(255, 255, 255, 0.1)')

	const arcProgress = d3.arc()
		.innerRadius(radius - 20)
		.outerRadius(radius)
		.startAngle(-Math.PI / 2)

	const path = g.append('path')
		.attr('fill', props.color)
		.style('filter', `drop-shadow(0 0 10px ${props.color})`)

	const targetAngle = -Math.PI / 2 + (Math.PI * percentage.value / 100)

	path.transition()
		.duration(1500)
		.attrTween('d', function() {
			const interpolate = d3.interpolate(-Math.PI / 2, targetAngle)
			return function(t) {
				return arcProgress.endAngle(interpolate(t))()
			}
		})

	g.append('text')
		.attr('text-anchor', 'middle')
		.attr('y', -10)
		.style('font-size', '28px')
		.style('font-weight', '700')
		.style('fill', props.color)
		.text(props.value.toFixed(1))

	g.append('text')
		.attr('text-anchor', 'middle')
		.attr('y', 15)
		.style('font-size', '12px')
		.style('fill', 'rgba(255, 255, 255, 0.6)')
		.text(props.unit)

	if (props.label) {
		g.append('text')
			.attr('text-anchor', 'middle')
			.attr('y', radius + 20)
			.style('font-size', '11px')
			.style('fill', 'rgba(255, 255, 255, 0.4)')
			.text(props.label)
	}
}

onMounted(() => {
	drawGauge()
	window.addEventListener('resize', drawGauge)
})

watch(() => [props.value, props.min, props.max], drawGauge)
</script>

<template>
	<div ref="svgRef" :class="$style.gaugeContainer" />
</template>

<style module>
.gaugeContainer {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}
</style>
