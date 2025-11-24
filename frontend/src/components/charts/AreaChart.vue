<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	data: {
		type: Array,
		required: true
	},
	xKey: { type: String, required: true },
	yKey: { type: String, required: true },
	color: { type: String, default: 'var(--neon-cyan)' },
	height: { type: Number, default: 300 },
	xLabel: { type: String, default: '' },
	yLabel: { type: String, default: '' },
	gradient: { type: Boolean, default: true }
})

const svgRef = ref(null)

const drawChart = () => {
	if (!svgRef.value || !props.data.length) return

	const container = svgRef.value
	const width = container.clientWidth
	const height = props.height
	const margin = { top: 20, right: 30, bottom: 60, left: 60 }

	d3.select(container).select('svg').remove()

	const svg = d3.select(container)
		.append('svg')
		.attr('width', width)
		.attr('height', height)

	const defs = svg.append('defs')
	const gradientId = 'areaGradient'

	const linearGradient = defs.append('linearGradient')
		.attr('id', gradientId)
		.attr('x1', '0%')
		.attr('y1', '0%')
		.attr('x2', '0%')
		.attr('y2', '100%')

	linearGradient.append('stop')
		.attr('offset', '0%')
		.attr('stop-color', props.color)
		.attr('stop-opacity', 0.6)

	linearGradient.append('stop')
		.attr('offset', '100%')
		.attr('stop-color', props.color)
		.attr('stop-opacity', 0.05)

	const g = svg.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`)

	const innerWidth = width - margin.left - margin.right
	const innerHeight = height - margin.top - margin.bottom

	const xScale = d3.scaleLinear()
		.domain(d3.extent(props.data, d => d[props.xKey]))
		.range([0, innerWidth])

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(props.data, d => d[props.yKey]) * 1.1])
		.range([innerHeight, 0])

	const area = d3.area()
		.x(d => xScale(d[props.xKey]))
		.y0(innerHeight)
		.y1(d => yScale(d[props.yKey]))
		.curve(d3.curveMonotoneX)

	const line = d3.line()
		.x(d => xScale(d[props.xKey]))
		.y(d => yScale(d[props.yKey]))
		.curve(d3.curveMonotoneX)

	const areaPath = g.append('path')
		.datum(props.data)
		.attr('fill', props.gradient ? `url(#${gradientId})` : props.color)
		.attr('d', area)
		.style('opacity', 0)

	areaPath.transition()
		.duration(1500)
		.ease(d3.easeQuadOut)
		.style('opacity', 1)

	const linePath = g.append('path')
		.datum(props.data)
		.attr('fill', 'none')
		.attr('stroke', props.color)
		.attr('stroke-width', 2)
		.attr('d', line)
		.style('filter', `drop-shadow(0 0 6px ${props.color})`)

	const totalLength = linePath.node().getTotalLength()

	linePath
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(1500)
		.ease(d3.easeLinear)
		.attr('stroke-dashoffset', 0)

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

watch(() => props.data, drawChart, { deep: true })
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
