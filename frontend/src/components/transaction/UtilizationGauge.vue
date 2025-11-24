<script setup>
import { ref, computed, onMounted } from "vue"

const props = defineProps({
	vaultStatus: Object
})

const animationProgress = ref(0)

const utilizationRate = computed(() => {
	if (!props.vaultStatus) return 0
	const cash = parseFloat(props.vaultStatus.cash || '0')
	const borrows = parseFloat(props.vaultStatus.totalBorrows || '0')
	const total = cash + borrows
	if (total === 0) return 0
	return (borrows / total) * 100
})

const interestRate = computed(() => {
	if (!props.vaultStatus) return 0
	return (parseFloat(props.vaultStatus.interestRate || '0') / 1e18) * 100
})

const gaugeColor = computed(() => {
	const rate = utilizationRate.value
	if (rate > 90) return '#ff0040'
	if (rate > 70) return '#ff6600'
	if (rate > 40) return '#ffff00'
	return '#00ff9d'
})

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(2)
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
		<Text size="16" weight="700" color="primary">VAULT UTILIZATION</Text>
		
		<div :class="$style.gaugeContainer">
			<div :class="$style.gauge">
				<svg width="200" height="120" viewBox="0 0 200 120">
					<!-- Background arc -->
					<path
						d="M 20 100 A 80 80 0 0 1 180 100"
						fill="none"
						stroke="rgba(255, 255, 255, 0.1)"
						stroke-width="8"
						stroke-linecap="round"
					/>
					
					<!-- Progress arc -->
					<path
						d="M 20 100 A 80 80 0 0 1 180 100"
						fill="none"
						:stroke="gaugeColor"
						stroke-width="8"
						stroke-linecap="round"
						:stroke-dasharray="`${(utilizationRate * animationProgress * 251.2) / 100} 251.2`"
						:style="{ 
							filter: `drop-shadow(0 0 10px ${gaugeColor})`,
							transition: 'stroke-dasharray 1.5s ease'
						}"
					/>
					
					<!-- Center indicator -->
					<circle
						cx="100"
						cy="100"
						r="4"
						:fill="gaugeColor"
						:style="{ filter: `drop-shadow(0 0 8px ${gaugeColor})` }"
					/>
				</svg>
				
				<div :class="$style.gaugeValue">
					<Text size="24" weight="700" color="primary" mono>
						{{ (utilizationRate * animationProgress).toFixed(1) }}%
					</Text>
					<Text size="11" weight="500" color="tertiary">UTILIZATION</Text>
				</div>
			</div>
			
			<div :class="$style.metrics">
				<div :class="$style.metric">
					<Text size="12" weight="600" color="green">CASH</Text>
					<Text size="16" weight="700" color="green" mono>
						{{ formatAmount(vaultStatus?.cash || '0') }}
					</Text>
				</div>
				
				<div :class="$style.metric">
					<Text size="12" weight="600" color="orange">BORROWS</Text>
					<Text size="16" weight="700" color="orange" mono>
						{{ formatAmount(vaultStatus?.totalBorrows || '0') }}
					</Text>
				</div>
				
				<div :class="$style.metric">
					<Text size="12" weight="600" color="blue">INTEREST RATE</Text>
					<Text size="16" weight="700" color="blue" mono>
						{{ (interestRate * animationProgress).toFixed(2) }}%
					</Text>
				</div>
			</div>
		</div>
	</div>
</template>

<style module>
.container {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 0, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.gaugeContainer {
	display: flex;
	align-items: center;
	gap: 24px;
	margin-top: 16px;
}

.gauge {
	position: relative;
	flex-shrink: 0;
}

.gaugeValue {
	position: absolute;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);
	text-align: center;
}

.metrics {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.metric {
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px;
	background: rgba(255, 255, 255, 0.02);
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
	.gaugeContainer {
		flex-direction: column;
		gap: 16px;
	}
	
	.metrics {
		width: 100%;
	}
}
</style>