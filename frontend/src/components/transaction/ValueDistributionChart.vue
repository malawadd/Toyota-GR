<script setup>
import { ref, computed, onMounted } from "vue"

const props = defineProps({
	swapData: Array,
	earnData: Array
})

const chartContainer = ref(null)
const animationProgress = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const chartData = computed(() => {
	const data = []
	
	// Process swap data
	props.swapData?.forEach((swap, index) => {
		const amountIn = parseFloat(swap.amount0In || swap.amount1In || '0')
		const amountOut = parseFloat(swap.amount0Out || swap.amount1Out || '0')
		
		if (amountIn > 0) {
			data.push({
				label: 'Amount In',
				value: amountIn,
				color: '#ff6600',
				percentage: 50
			})
		}
		
		if (amountOut > 0) {
			data.push({
				label: 'Amount Out',
				value: amountOut,
				color: '#00ff9d',
				percentage: 50
			})
		}
	})
	
	// Process earn data
	props.earnData?.forEach((earn) => {
		if (earn.assets) {
			data.push({
				label: 'Earn Assets',
				value: parseFloat(earn.assets),
				color: '#00aaff',
				percentage: 100
			})
		}
	})
	
	// Calculate percentages
	const total = data.reduce((sum, item) => sum + item.value, 0)
	return data.map(item => ({
		...item,
		percentage: total > 0 ? (item.value / total) * 100 : 0
	}))
})

onMounted(() => {
	const animate = () => {
		animationProgress.value += 0.02
		if (animationProgress.value < 1) {
			requestAnimationFrame(animate)
		}
	}
	
	setTimeout(animate, 300)
})
</script>

<template>
	<div :class="$style.container">
		<Text size="16" weight="700" color="primary">VALUE DISTRIBUTION</Text>
		
		<div ref="chartContainer" :class="$style.chart">
			<div :class="$style.pieChart">
				<svg width="200" height="200" viewBox="0 0 200 200">
					<circle
						cx="100"
						cy="100"
						r="80"
						fill="none"
						stroke="rgba(255, 255, 255, 0.1)"
						stroke-width="4"
					/>
					
					<circle
						v-for="(item, index) in chartData"
						:key="index"
						cx="100"
						cy="100"
						r="80"
						fill="none"
						:stroke="item.color"
						stroke-width="8"
						:stroke-dasharray="`${(item.percentage * animationProgress * 502.4) / 100} 502.4`"
						:stroke-dashoffset="index * -125.6"
						:style="{ 
							transform: `rotate(${index * 90}deg)`,
							transformOrigin: '100px 100px',
							transition: 'stroke-dasharray 1s ease'
						}"
					/>
				</svg>
				
				<div :class="$style.centerText">
					<Text size="12" weight="600" color="tertiary">TOTAL</Text>
					<Text size="16" weight="700" color="primary" mono>
						{{ chartData.length }}
					</Text>
				</div>
			</div>
			
			<div :class="$style.legend">
				<div
					v-for="(item, index) in chartData"
					:key="index"
					:class="$style.legendItem"
					:style="{ 
						opacity: animationProgress > (index * 0.2) ? 1 : 0,
						transform: `translateY(${animationProgress > (index * 0.2) ? 0 : 20}px)`
					}"
				>
					<div :class="$style.legendColor" :style="{ background: item.color }" />
					<div :class="$style.legendInfo">
						<Text size="12" weight="600" color="secondary">{{ item.label }}</Text>
						<Text size="11" weight="500" color="tertiary" mono>
							{{ formatAmount(item.value.toString()) }}
						</Text>
						<Text size="10" weight="500" color="support">
							{{ item.percentage.toFixed(1) }}%
						</Text>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style module>
.container {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.chart {
	display: flex;
	align-items: center;
	gap: 24px;
	margin-top: 16px;
}

.pieChart {
	position: relative;
	flex-shrink: 0;
}

.centerText {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
}

.legend {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.legendItem {
	display: flex;
	align-items: center;
	gap: 12px;
	transition: all 0.5s ease;
}

.legendColor {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	flex-shrink: 0;
}

.legendInfo {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

@media (max-width: 768px) {
	.chart {
		flex-direction: column;
		gap: 16px;
	}
}
</style>