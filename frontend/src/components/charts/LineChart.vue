<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	data: {
		type: Array,
		required: true
	},
	xKey: {
		type: String,
		required: true
	},
	yKey: {
		type: String,
		required: true
	},
	color: {
		type: String,
		default: 'var(--neon-lime)'
	},
	height: {
		type: Number,
		default: 300
	},
	showGradient: {
		type: Boolean,
		default: true
	},
	xLabel: {
		type: String,
		default: ''
	},
	yLabel: {
		type: String,
		default: ''
	}
})

const svgRef = ref(null)

const drawChart = () => {
	if (!svgRef.value || !props.data.length) return

	const container = svgRef.value
	const width = container.clientWidth
	const height = props.height
	const margin = { top: 20, right: 30, bottom: 40, left: 60 }

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
		.domain(d3.extent(props.data, d => d[props.xKey]))
		.range([0, innerWidth])

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(props.data, d => d[props.yKey]) * 1.1])
		.range([innerHeight, 0])

	if (props.showGradient) {
		const gradient = svg.append('defs')
			.append('linearGradient')
			.attr('id', 'lineGradient')
			.attr('x1', '0%')
			.attr('y1', '0%')
			.attr('x2', '0%')
			.attr('y2', '100%')

		gradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', props.color)
			.attr('stop-opacity', 0.3)

		gradient.append('stop')
			.attr('offset', '100%')
			.attr('stop-color', props.color)
			.attr('stop-opacity', 0)
	}

	const line = d3.line()
		.x(d => xScale(d[props.xKey]))
		.y(d => yScale(d[props.yKey]))
		.curve(d3.curveMonotoneX)

	const area = d3.area()
		.x(d => xScale(d[props.xKey]))
		.y0(innerHeight)
		.y1(d => yScale(d[props.yKey]))
		.curve(d3.curveMonotoneX)

	if (props.showGradient) {
		g.append('path')
			.datum(props.data)
			.attr('fill', 'url(#lineGradient)')
			.attr('d', area)
	}

	const path = g.append('path')
		.datum(props.data)
		.attr('fill', 'none')
		.attr('stroke', props.color)
		.attr('stroke-width', 2)
		.attr('d', line)
		.style('filter', `drop-shadow(0 0 8px ${props.color})`)

	const totalLength = path.node().getTotalLength()

	path
		.attr('stroke-dasharray', totalLength + ' ' + totalLength)
		.attr('stroke-dashoffset', totalLength)
		.transition()
		.duration(2000)
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
			.attr('y', innerHeight + 35)
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
