<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useAppStore } from "@/stores/app"
import { mapChainName } from "@/services/api/defillama"

const props = defineProps({
	protocolData: Object
})

const appStore = useAppStore()
const chartContainer = ref(null)
const animationProgress = ref(0)
const hoveredPoint = ref(null)

const formatAmount = (amount) => {
	if (amount > 1e9) return `$${(amount/1e9).toFixed(2)}B`
	if (amount > 1e6) return `$${(amount/1e6).toFixed(2)}M`
	if (amount > 1e3) return `$${(amount/1e3).toFixed(2)}K`
	return `$${amount.toFixed(2)}`
}

const formatDate = (timestamp) => {
	return new Date(timestamp * 1000).toLocaleDateString()
}

// Process TVL data for the chart
const chartData = computed(() => {
	if (!props.protocolData?.chainTvls) return { total: [], chain: [] }
	
	const currentChain = mapChainName(appStore.network)
	const chainTvls = props.protocolData.chainTvls
	
	// Get total TVL data (sum all chains)
	const allChainData = new Map()
	
	Object.keys(chainTvls).forEach(chainKey => {
		if (chainKey.includes('-borrowed')) return // Skip borrowed data for now
		
		const tvlData = chainTvls[chainKey]?.tvl || []
		tvlData.forEach(point => {
			const existing = allChainData.get(point.date) || 0
			allChainData.set(point.date, existing + point.totalLiquidityUSD)
		})
	})
	
	// Convert to array and sort by date
	const totalData = Array.from(allChainData.entries())
		.map(([date, tvl]) => ({ date: parseInt(date), tvl }))
		.sort((a, b) => a.date - b.date)
		.slice(-90) // Last 90 days
	
	// Get current chain data
	const chainData = chainTvls[currentChain]?.tvl || []
	const processedChainData = chainData
		.map(point => ({ date: point.date, tvl: point.totalLiquidityUSD }))
		.sort((a, b) => a.date - b.date)
		.slice(-90) // Last 90 days
	
	return {
		total: totalData,
		chain: processedChainData,
		currentChain
	}
})

const maxTvl = computed(() => {
	const allValues = [...chartData.value.total.map(d => d.tvl), ...chartData.value.chain.map(d => d.tvl)]
	return Math.max(...allValues, 0)
})

const currentTvl = computed(() => {
	const total = chartData.value.total
	const chain = chartData.value.chain
	return {
		total: total.length > 0 ? total[total.length - 1].tvl : 0,
		chain: chain.length > 0 ? chain[chain.length - 1].tvl : 0
	}
})

// Generate SVG path for line chart
const generatePath = (data, height, width) => {
	if (!data.length) return ''
	
	const xStep = width / (data.length - 1)
	
	return data.map((point, index) => {
		const x = index * xStep
		const y = height - (point.tvl / maxTvl.value) * height
		return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
	}).join(' ')
}

onMounted(() => {
	const animate = () => {
		animationProgress.value += 0.02
		if (animationProgress.value < 1) {
			requestAnimationFrame(animate)
		}
	}
	
	setTimeout(animate, 500)
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Text size="18" weight="700" color="primary">TOTAL VALUE LOCKED</Text>
				<div :class="$style.chainBadge">
					<Text size="11" weight="700" color="blue">{{ chartData.currentChain.toUpperCase() }}</Text>
				</div>
			</Flex>
			
			<!-- Current Values -->
			<div :class="$style.metricsGrid">
				<div :class="$style.totalCard">
					<Text size="12" weight="600" color="green">PROTOCOL TOTAL</Text>
					<Text size="24" weight="700" color="green" mono>
						{{ formatAmount(currentTvl.total) }}
					</Text>
				</div>
				
				<div :class="$style.chainCard">
					<Text size="12" weight="600" color="blue">{{ chartData.currentChain.toUpperCase() }}</Text>
					<Text size="24" weight="700" color="blue" mono>
						{{ formatAmount(currentTvl.chain) }}
					</Text>
				</div>
			</div>
			
			<!-- Chart -->
			<div ref="chartContainer" :class="$style.chartContainer">
				<svg width="100%" height="300" viewBox="0 0 800 300">
					<!-- Grid lines -->
					<defs>
						<pattern id="grid" width="80" height="60" patternUnits="userSpaceOnUse">
							<path d="M 80 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#grid)" />
					
					<!-- Total TVL Line -->
					<path
						:d="generatePath(chartData.total, 280, 780)"
						fill="none"
						stroke="#00ff9d"
						stroke-width="3"
						:stroke-dasharray="`${animationProgress * 2000} 2000`"
						:style="{ 
							filter: 'drop-shadow(0 0 8px #00ff9d)',
							transition: 'stroke-dasharray 2s ease'
						}"
					/>
					
					<!-- Chain TVL Line -->
					<path
						:d="generatePath(chartData.chain, 280, 780)"
						fill="none"
						stroke="#00aaff"
						stroke-width="2"
						:stroke-dasharray="`${animationProgress * 1500} 1500`"
						:style="{ 
							filter: 'drop-shadow(0 0 6px #00aaff)',
							transition: 'stroke-dasharray 2s ease'
						}"
					/>
					
					<!-- Data points -->
					<g v-if="animationProgress > 0.8">
						<circle
							v-for="(point, index) in chartData.total.slice(-10)"
							:key="`total-${index}`"
							:cx="(index / 9) * 780"
							:cy="280 - (point.tvl / maxTvl) * 280"
							r="4"
							fill="#00ff9d"
							:style="{ filter: 'drop-shadow(0 0 4px #00ff9d)' }"
						/>
						
						<circle
							v-for="(point, index) in chartData.chain.slice(-10)"
							:key="`chain-${index}`"
							:cx="(index / 9) * 780"
							:cy="280 - (point.tvl / maxTvl) * 280"
							r="3"
							fill="#00aaff"
							:style="{ filter: 'drop-shadow(0 0 4px #00aaff)' }"
						/>
					</g>
				</svg>
			</div>
			
			<!-- Legend -->
			<div :class="$style.legend">
				<div :class="$style.legendItem">
					<div :class="$style.legendColor" style="background: #00ff9d;" />
					<Text size="12" weight="600" color="green">Protocol Total</Text>
				</div>
				<div :class="$style.legendItem">
					<div :class="$style.legendColor" style="background: #00aaff;" />
					<Text size="12" weight="600" color="blue">{{ chartData.currentChain }}</Text>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.chainBadge {
	padding: 4px 8px;
	background: rgba(0, 170, 255, 0.2);
	border: 1px solid rgba(0, 170, 255, 0.5);
	border-radius: 4px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
}

.totalCard {
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 6px;
	padding: 16px;
	text-align: center;
}

.chainCard {
	background: rgba(0, 170, 255, 0.1);
	border: 1px solid rgba(0, 170, 255, 0.3);
	border-radius: 6px;
	padding: 16px;
	text-align: center;
}

.chartContainer {
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
	padding: 16px;
	overflow: hidden;
}

.legend {
	display: flex;
	justify-content: center;
	gap: 24px;
}

.legendItem {
	display: flex;
	align-items: center;
	gap: 8px;
}

.legendColor {
	width: 12px;
	height: 12px;
	border-radius: 50%;
}
</style>