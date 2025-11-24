<template>
	<div class="lap-comparison-chart card">
		<h2>📈 Lap Comparison</h2>
		
		<div class="chart-container">
			<svg ref="chartSvg" :width="width" :height="height"></svg>
		</div>

		<div class="legend">
			<div class="legend-item">
				<span class="legend-color" style="background: #667eea;"></span>
				<span>{{ lap1Label }}</span>
			</div>
			<div class="legend-item" v-if="lap2Data && lap2Data.length > 0">
				<span class="legend-color" style="background: #f59e0b;"></span>
				<span>{{ lap2Label }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	lap1Data: {
		type: Array,
		required: true
	},
	lap2Data: {
		type: Array,
		default: () => []
	},
	lap1Label: {
		type: String,
		default: 'Lap 1'
	},
	lap2Label: {
		type: String,
		default: 'Lap 2'
	}
})

const chartSvg = ref(null)
const width = ref(1000)
const height = ref(400)

const drawChart = () => {
	if (!chartSvg.value || !props.lap1Data || props.lap1Data.length === 0) return

	const svg = d3.select(chartSvg.value)
	svg.selectAll('*').remove()

	const margin = { top: 20, right: 30, bottom: 50, left: 60 }
	const innerWidth = width.value - margin.left - margin.right
	const innerHeight = height.value - margin.top - margin.bottom

	const g = svg.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`)

	// Prepare data
	const lap1Speeds = props.lap1Data.map((d, i) => ({ index: i, speed: d.speed || 0 }))
	const lap2Speeds = props.lap2Data.length > 0 
		? props.lap2Data.map((d, i) => ({ index: i, speed: d.speed || 0 }))
		: []

	// Scales
	const xScale = d3.scaleLinear()
		.domain([0, Math.max(lap1Speeds.length, lap2Speeds.length)])
		.range([0, innerWidth])

	const allSpeeds = [...lap1Speeds.map(d => d.speed), ...lap2Speeds.map(d => d.speed)]
	const yScale = d3.scaleLinear()
		.domain([0, d3.max(allSpeeds) * 1.1])
		.range([innerHeight, 0])

	// Axes
	g.append('g')
		.attr('transform', `translate(0,${innerHeight})`)
		.call(d3.axisBottom(xScale).ticks(10))
		.append('text')
		.attr('x', innerWidth / 2)
		.attr('y', 40)
		.attr('fill', '#374151')
		.attr('font-weight', 600)
		.text('Data Points')

	g.append('g')
		.call(d3.axisLeft(yScale))
		.append('text')
		.attr('transform', 'rotate(-90)')
		.attr('y', -45)
		.attr('x', -innerHeight / 2)
		.attr('fill', '#374151')
		.attr('font-weight', 600)
		.text('Speed (km/h)')

	// Line generator
	const line = d3.line()
		.x(d => xScale(d.index))
		.y(d => yScale(d.speed))
		.curve(d3.curveMonotoneX)

	// Draw lap 1 line
	g.append('path')
		.datum(lap1Speeds)
		.attr('fill', 'none')
		.attr('stroke', '#667eea')
		.attr('stroke-width', 3)
		.attr('d', line)

	// Draw lap 2 line if available
	if (lap2Speeds.length > 0) {
		g.append('path')
			.datum(lap2Speeds)
			.attr('fill', 'none')
			.attr('stroke', '#f59e0b')
			.attr('stroke-width', 3)
			.attr('stroke-dasharray', '5,5')
			.attr('d', line)
	}

	// Add grid lines
	g.append('g')
		.attr('class', 'grid')
		.attr('opacity', 0.1)
		.call(d3.axisLeft(yScale)
			.tickSize(-innerWidth)
			.tickFormat('')
		)
}

onMounted(() => {
	drawChart()
})

watch(() => [props.lap1Data, props.lap2Data], () => {
	drawChart()
}, { deep: true })
</script>

<style scoped lang="scss">
.lap-comparison-chart {
	h2 {
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}
}

.chart-container {
	overflow-x: auto;
	margin-bottom: 1rem;
}

.legend {
	display: flex;
	gap: 2rem;
	justify-content: center;
	padding: 1rem;
	background: #f9fafb;
	border-radius: 8px;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: #374151;
}

.legend-color {
	width: 30px;
	height: 4px;
	border-radius: 2px;
}
</style>
