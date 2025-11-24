<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	data: {
		type: Array,
		required: true
	},
	valueKey: { type: String, required: true },
	bins: { type: Number, default: 10 },
	color: { type: String, default: 'var(--neon-cyan)' },
	height: { type: Number, default: 300 },
	xLabel: { type: String, default: '' },
	yLabel: { type: String, default: 'Frequency' }
})

const svgRef = ref(null)

const histogramData = computed(() => {
	if (!props.data.length) return []

	const values = props.data.map(d => d[props.valueKey])
	const extent = d3.extent(values)
	const binGenerator = d3.bin()
		.domain(extent)
		.thresholds(props.bins)

	return binGenerator(values)
})

const drawChart = () => {
	if (!svgRef.value || !histogramData.value.length) return

	const container = svgRef.value
	const width = container.clientWidth
	const height = props.height
	const margin = { top: 20, right: 30, bottom: 60, left: 60 }

	d3.select(container).select('svg').remove()

	const svg = d3.select(container)
		.append('svg')
		.attr('width', width)
		.attr('height', height)

	const g = svg.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`)

	const innerWidth = width - margin.left - margin.right
	const innerHeight = height - margin.top - margin.bottom

	const xScale = d3.scaleLinear()
		.domain([histogramData.value[0].x0, histogramData.value[histogramData.value.length - 1].x1])
		.range([0, innerWidth])

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(histogramData.value, d => d.length)])
		.range([innerHeight, 0])

	const bars = g.selectAll('rect')
		.data(histogramData.value)
		.enter()
		.append('rect')
		.attr('x', d => xScale(d.x0))
		.attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
		.attr('y', innerHeight)
		.attr('height', 0)
		.attr('fill', props.color)
		.attr('opacity', 0.7)
		.style('filter', `drop-shadow(0 0 6px ${props.color})`)

	bars.transition()
		.duration(1000)
		.delay((d, i) => i * 50)
		.ease(d3.easeCubicOut)
		.attr('y', d => yScale(d.length))
		.attr('height', d => innerHeight - yScale(d.length))

	bars.on('mouseenter', function() {
		d3.select(this)
			.transition()
			.duration(200)
			.attr('opacity', 1)
	})
	.on('mouseleave', function() {
		d3.select(this)
			.transition()
			.duration(200)
			.attr('opacity', 0.7)
	})

	g.append('g')
		.attr('transform', `translate(0,${innerHeight})`)
		.call(d3.axisBottom(xScale).ticks(6))
		.style('color', 'rgba(255, 255, 255, 0.4)')

	g.append('g')
		.call(d3.axisLeft(yScale).ticks(5))
		.style('color', 'rgba(255, 255, 255, 0.4)')

	if (props.xLabel) {
		g.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 40)
			.attr('text-anchor', 'middle')
			.style('fill', 'rgba(255, 255, 255, 0.6)')
			.style('font-size', '12px')
			.text(props.xLabel)
	}

	if (props.yLabel) {
		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -innerHeight / 2)
			.attr('y', -45)
			.attr('text-anchor', 'middle')
			.style('fill', 'rgba(255, 255, 255, 0.6)')
			.style('font-size', '12px')
			.text(props.yLabel)
	}
}

onMounted(() => {
	drawChart()
	window.addEventListener('resize', drawChart)
})

watch(() => [props.data, props.bins], drawChart, { deep: true })
</script>

<template>
	<div ref="svgRef" :class="$style.chartContainer" />
</template>

<style module>
.chartContainer {
	width: 100%;
	position: relative;
}
</style>
