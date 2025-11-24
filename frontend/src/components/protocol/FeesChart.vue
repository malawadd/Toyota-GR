<script setup>
import { ref, computed, onMounted } from "vue"
import { useAppStore } from "@/stores/app"
import { mapChainName } from "@/services/api/defillama"

const props = defineProps({
	feesData: Object
})

const appStore = useAppStore()
const animationProgress = ref(0)

const formatAmount = (amount) => {
	if (amount > 1e6) return `$${(amount/1e6).toFixed(2)}M`
	if (amount > 1e3) return `$${(amount/1e3).toFixed(2)}K`
	return `$${amount.toFixed(2)}`
}

// Process fees data
const feesMetrics = computed(() => {
	if (!props.feesData) return {}
	
	return {
		total24h: props.feesData.total24h || 0,
		total48hto24h: props.feesData.total48hto24h || 0,
		total7d: props.feesData.total7d || 0,
		totalAllTime: props.feesData.totalAllTime || 0,
		change24h: props.feesData.total24h && props.feesData.total48hto24h 
			? ((props.feesData.total24h - props.feesData.total48hto24h) / props.feesData.total48hto24h) * 100 
			: 0
	}
})

// Process chart data for last 30 days
const chartData = computed(() => {
	if (!props.feesData?.totalDataChart) return []
	
	return props.feesData.totalDataChart
		.slice(-30) // Last 30 days
		.map(([timestamp, value]) => ({
			date: timestamp,
			value: value || 0,
			formattedDate: new Date(timestamp * 1000).toLocaleDateString()
		}))
})

// Process chain breakdown for current chain
const chainBreakdown = computed(() => {
	if (!props.feesData?.totalDataChartBreakdown) return []
	
	const currentChain = mapChainName(appStore.network)
	
	return props.feesData.totalDataChartBreakdown
		.slice(-7) // Last 7 days
		.map(([timestamp, chainData]) => {
			const chainValue = chainData[currentChain]?.['Euler V2'] || 0
			return {
				date: timestamp,
				value: chainValue,
				formattedDate: new Date(timestamp * 1000).toLocaleDateString()
			}
		})
})

const maxValue = computed(() => {
	const allValues = chartData.value.map(d => d.value)
	return Math.max(...allValues, 0)
})

// Generate bars for the chart
const generateBars = (data, height, width) => {
	if (!data.length) return []
	
	const barWidth = width / data.length * 0.8
	const barSpacing = width / data.length * 0.2
	
	return data.map((point, index) => {
		const x = index * (width / data.length) + barSpacing / 2
		const barHeight = maxValue.value > 0 ? (point.value / maxValue.value) * height : 0
		const y = height - barHeight
		
		return {
			x,
			y,
			width: barWidth,
			height: barHeight,
			value: point.value,
			date: point.formattedDate
		}
	})
}

onMounted(() => {
	const animate = () => {
		animationProgress.value += 0.02
		if (animationProgress.value < 1) {
			requestAnimationFrame(animate)
		}
	}
	
	setTimeout(animate, 800)
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Text size="18" weight="700" color="primary">PROTOCOL FEES & REVENUE</Text>
			
			<!-- Metrics Grid -->
			<div :class="$style.metricsGrid">
				<div :class="$style.metricCard">
					<Text size="12" weight="600" color="orange">24H FEES</Text>
					<Text size="20" weight="700" color="orange" mono>
						{{ formatAmount(feesMetrics.total24h) }}
					</Text>
					<Text 
						size="11" 
						weight="500" 
						:color="feesMetrics.change24h >= 0 ? 'green' : 'red'"
					>
						{{ feesMetrics.change24h >= 0 ? '+' : '' }}{{ feesMetrics.change24h.toFixed(1) }}%
					</Text>
				</div>
				
				<div :class="$style.metricCard">
					<Text size="12" weight="600" color="blue">7D FEES</Text>
					<Text size="20" weight="700" color="blue" mono>
						{{ formatAmount(feesMetrics.total7d) }}
					</Text>
				</div>
				
				<div :class="$style.metricCard">
					<Text size="12" weight="600" color="purple">ALL TIME</Text>
					<Text size="20" weight="700" color="purple" mono>
						{{ formatAmount(feesMetrics.totalAllTime) }}
					</Text>
				</div>
			</div>
			
			<!-- Fees Chart -->
			<div :class="$style.chartSection">
				<Text size="14" weight="600" color="secondary">DAILY FEES (30 DAYS)</Text>
				
				<div :class="$style.chartContainer">
					<svg width="100%" height="200" viewBox="0 0 600 200">
						<!-- Grid -->
						<defs>
							<pattern id="feesGrid" width="60" height="40" patternUnits="userSpaceOnUse">
								<path d="M 60 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#feesGrid)" />
						
						<!-- Bars -->
						<g v-if="chartData.length > 0">
							<rect
								v-for="(bar, index) in generateBars(chartData, 180, 580)"
								:key="index"
								:x="bar.x"
								:y="bar.y"
								:width="bar.width"
								:height="bar.height * animationProgress"
								fill="url(#feesGradient)"
								:style="{ 
									filter: 'drop-shadow(0 0 4px rgba(255, 165, 0, 0.5))',
									transition: 'height 1s ease'
								}"
							/>
						</g>
						
						<!-- Gradient definition -->
						<defs>
							<linearGradient id="feesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#ff6600;stop-opacity:0.8" />
								<stop offset="100%" style="stop-color:#ff6600;stop-opacity:0.2" />
							</linearGradient>
						</defs>
					</svg>
				</div>
			</div>
			
			<!-- Chain Breakdown -->
			<div v-if="chainBreakdown.length > 0" :class="$style.chainSection">
				<Text size="14" weight="600" color="secondary">
					{{ mapChainName(appStore.network).toUpperCase() }} FEES (7 DAYS)
				</Text>
				
				<div :class="$style.chainBars">
					<div
						v-for="(day, index) in chainBreakdown"
						:key="index"
						:class="$style.chainBar"
					>
						<div 
							:class="$style.chainBarFill"
							:style="{ 
								height: `${chainBreakdown.length > 0 ? (day.value / Math.max(...chainBreakdown.map(d => d.value), 1)) * 100 : 0}%`,
								background: 'linear-gradient(to top, #00aaff, #00ffff)',
								transform: `scaleY(${animationProgress})`
							}"
						/>
						<Text size="10" weight="500" color="tertiary">
							{{ day.formattedDate.split('/')[1] }}/{{ day.formattedDate.split('/')[2] }}
						</Text>
						<Text size="11" weight="600" color="blue" mono>
							{{ formatAmount(day.value) }}
						</Text>
					</div>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	background: linear-gradient(135deg, rgba(255, 165, 0, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 165, 0, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
}

.metricCard {
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	text-align: center;
}

.chartSection {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.chartContainer {
	background: rgba(0, 0, 0, 0.3);
	border-radius: 6px;
	padding: 16px;
}

.chainSection {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.chainBars {
	display: flex;
	gap: 8px;
	align-items: end;
	height: 100px;
}

.chainBar {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	height: 100%;
}

.chainBarFill {
	width: 100%;
	background: rgba(0, 170, 255, 0.3);
	border-radius: 2px;
	transform-origin: bottom;
	transition: transform 1s ease;
}
</style>