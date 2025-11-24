<script setup>
import { ref, computed, onMounted } from "vue"
import { DateTime } from "luxon"

const props = defineProps({
	liquidations: Array
})

const chartContainer = ref(null)
const animationProgress = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

// Process liquidation data
const liquidationStats = computed(() => {
	if (!props.liquidations?.length) return { asViolator: 0, asLiquidator: 0, totalValue: 0 }
	
	let asViolator = 0
	let asLiquidator = 0
	let totalValue = 0
	
	props.liquidations.forEach(liq => {
		totalValue += parseFloat(liq.repayAssets || '0')
		// Note: We can't determine which role without the account ID
		// This would need to be passed as a prop or computed in parent
	})
	
	return { asViolator, asLiquidator, totalValue }
})

// Recent liquidations for timeline
const recentLiquidations = computed(() => {
	return props.liquidations
		.slice(0, 5)
		.map((liq, index) => ({
			...liq,
			delay: index * 0.2
		}))
})

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
		<Text size="16" weight="700" color="primary">LIQUIDATION HISTORY</Text>
		
		<div v-if="!liquidations?.length" :class="$style.noData">
			<Icon name="check-circle" size="32" color="green" />
			<Text size="14" weight="600" color="green">NO LIQUIDATIONS</Text>
			<Text size="12" weight="500" color="tertiary">This account has a clean liquidation history</Text>
		</div>
		
		<div v-else :class="$style.content">
			<!-- Stats Overview -->
			<div :class="$style.statsGrid">
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="red">TOTAL EVENTS</Text>
					<Text size="20" weight="700" color="red" mono>{{ liquidations.length }}</Text>
				</div>
				
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="orange">TOTAL VALUE</Text>
					<Text size="20" weight="700" color="orange" mono>
						{{ formatAmount(liquidationStats.totalValue.toString()) }}
					</Text>
				</div>
			</div>
			
			<!-- Timeline -->
			<div :class="$style.timeline">
				<Text size="14" weight="600" color="tertiary">RECENT EVENTS</Text>
				
				<div :class="$style.timelineList">
					<div
						v-for="(liq, index) in recentLiquidations"
						:key="liq.id"
						:class="$style.timelineItem"
						:style="{
							opacity: animationProgress > liq.delay ? 1 : 0,
							transform: `translateX(${animationProgress > liq.delay ? 0 : -20}px)`
						}"
					>
						<div :class="$style.timelineMarker" />
						
						<div :class="$style.timelineContent">
							<Flex align="center" justify="between">
								<Text size="12" weight="600" color="red">LIQUIDATION</Text>
								<Text size="10" weight="500" color="tertiary">
									{{ DateTime.fromSeconds(parseInt(liq.blockTimestamp)).toRelative() }}
								</Text>
							</Flex>
							
							<Text size="11" weight="500" color="secondary">
								{{ formatAddress(liq.liquidator) }} → {{ formatAddress(liq.violator) }}
							</Text>
							
							<Text size="12" weight="600" color="orange" mono>
								{{ formatAmount(liq.repayAssets) }}
							</Text>
						</div>
						
						<div v-if="index < recentLiquidations.length - 1" :class="$style.timelineConnector" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style module>
.container {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.noData {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 32px;
	text-align: center;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-top: 16px;
}

.statsGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.statCard {
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 6px;
	padding: 12px;
	text-align: center;
}

.timeline {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.timelineList {
	position: relative;
}

.timelineItem {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	position: relative;
	transition: all 0.5s ease;
	margin-bottom: 16px;
}

.timelineMarker {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #ff0040;
	border: 2px solid rgba(255, 0, 64, 0.3);
	flex-shrink: 0;
	margin-top: 4px;
	box-shadow: 0 0 8px rgba(255, 0, 64, 0.5);
}

.timelineContent {
	flex: 1;
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.1);
	border-radius: 6px;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.timelineConnector {
	position: absolute;
	left: 3px;
	top: 16px;
	width: 2px;
	height: 20px;
	background: rgba(255, 0, 64, 0.3);
}
</style>