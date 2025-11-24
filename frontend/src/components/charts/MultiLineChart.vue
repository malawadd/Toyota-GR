<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	series: {
		type: Array,
		required: true
	},
	xKey: { type: String, required: true },
	yKey: { type: String, required: true },
	height: { type: Number, default: 300 },
	xLabel: { type: String, default: '' },
	yLabel: { type: String, default: '' },
	colors: { type: Array, default: () => ['var(--neon-cyan)', 'var(--electric-blue)', 'var(--neon-lime)', 'var(--neon-pink)'] }
})

const svgRef = ref(null)
const visibleSeries = ref(new Set(props.series.map((s, i) => i)))

const toggleSeries = (index) => {
	if (visibleSeries.value.has(index)) {
		visibleSeries.value.delete(index)
	} else {
		visibleSeries.value.add(index)
	}
	drawChart()
}

const getColor = (index) => {
	return props.colors[index % props.colors.length]
}

const drawChart = () => {
	if (!svgRef.value || props.series.length === 0) return

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

	const allData = props.series.flatMap(s => s.data)

	const xScale = d3.scaleLinear()
		.domain(d3.extent(allData, d => d[props.xKey]))
		.range([0, innerWidth])

	const yScale = d3.scaleLinear()
		.domain([0, d3.max(allData, d => d[props.yKey]) * 1.1])
		.range([innerHeight, 0])

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

	const line = d3.line()
		.x(d => xScale(d[props.xKey]))
		.y(d => yScale(d[props.yKey]))
		.curve(d3.curveMonotoneX)

	props.series.forEach((series, index) => {
		if (!visibleSeries.value.has(index)) return

		const color = getColor(index)
		const path = g.append('path')
			.datum(series.data)
			.attr('fill', 'none')
			.attr('stroke', color)
			.attr('stroke-width', 2)
			.attr('d', line)
			.style('filter', `drop-shadow(0 0 4px ${color})`)

		const totalLength = path.node().getTotalLength()

		path
			.attr('stroke-dasharray', totalLength + ' ' + totalLength)
			.attr('stroke-dashoffset', totalLength)
			.transition()
			.duration(1500)
			.delay(index * 200)
			.ease(d3.easeLinear)
			.attr('stroke-dashoffset', 0)
	})
}

onMounted(() => {
	drawChart()
	window.addEventListener('resize', drawChart)
})

watch(() => [props.series, visibleSeries.value.size], drawChart, { deep: true })
</script>

<template>
	<Flex direction="column" gap="16" wide>
		<Flex align="center" gap="12" wrap>
			<button
				v-for="(series, index) in series"
				:key="index"
				@click="toggleSeries(index)"
				:class="[$style.legendButton, !visibleSeries.has(index) && $style.inactive]"
			>
				<div :class="$style.legendDot" :style="{ background: getColor(index) }" />
				<Text size="11" weight="600" :color="visibleSeries.has(index) ? 'primary' : 'support'">
					{{ series.name }}
				</Text>
			</button>
		</Flex>

		<div ref="svgRef" :class="$style.chartContainer" />
	</Flex>
</template>

<style module>
.chartContainer {
	width: 100%;
	position: relative;
}

.legendButton {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.legendButton:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.2);
}

.legendButton.inactive {
	opacity: 0.4;
}

.legendDot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	box-shadow: 0 0 6px currentColor;
}
</style>
