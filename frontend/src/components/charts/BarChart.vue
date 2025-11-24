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

	const xScale = d3.scaleBand()
		.domain(props.data.map(d => d[props.xKey]))
		.range([0, innerWidth])
		.padding(0.2)

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(props.data, d => d[props.yKey]) * 1.1])
		.range([innerHeight, 0])

	g.selectAll('.bar')
		.data(props.data)
		.enter()
		.append('rect')
		.attr('class', 'bar')
		.attr('x', d => xScale(d[props.xKey]))
		.attr('width', xScale.bandwidth())
		.attr('y', innerHeight)
		.attr('height', 0)
		.attr('fill', props.color)
		.style('filter', `drop-shadow(0 0 8px ${props.color})`)
		.transition()
		.duration(1000)
		.delay((d, i) => i * 100)
		.attr('y', d => yScale(d[props.yKey]))
		.attr('height', d => innerHeight - yScale(d[props.yKey]))

	g.append('g')
		.attr('transform', `translate(0,${innerHeight})`)
		.call(d3.axisBottom(xScale))
		.style('color', 'rgba(255, 255, 255, 0.4)')
		.selectAll('text')
		.attr('transform', 'rotate(-45)')
		.style('text-anchor', 'end')

	g.append('g')
		.call(d3.axisLeft(yScale).ticks(5))
		.style('color', 'rgba(255, 255, 255, 0.4)')

	if (props.xLabel) {
		g.append('text')
			.attr('x', innerWidth / 2)
			.attr('y', innerHeight + 50)
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
