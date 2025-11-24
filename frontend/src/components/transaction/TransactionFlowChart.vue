<script setup>
import { ref, onMounted, computed } from "vue"

const props = defineProps({
	events: Array,
	txHash: String
})

const flowContainer = ref(null)
const animationProgress = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

const flowSteps = computed(() => {
	const steps = []
	
	// Process different event types
	props.events.forEach((event, index) => {
		if (event.type === 'deposit') {
			steps.push({
				id: index,
				type: 'deposit',
				from: formatAddress(event.sender),
				to: 'VAULT',
				amount: formatAmount(event.assets),
				color: '#00ff9d',
				icon: 'coins'
			})
		} else if (event.type === 'borrow') {
			steps.push({
				id: index,
				type: 'borrow',
				from: 'VAULT',
				to: formatAddress(event.account),
				amount: formatAmount(event.assets),
				color: '#ff6600',
				icon: 'blob'
			})
		} else if (event.type === 'transfer') {
			steps.push({
				id: index,
				type: 'transfer',
				from: formatAddress(event.from),
				to: formatAddress(event.to),
				amount: formatAmount(event.value),
				color: '#00aaff',
				icon: 'arrow-top-right'
			})
		} else if (event.type === 'liquidate') {
			steps.push({
				id: index,
				type: 'liquidation',
				from: formatAddress(event.violator),
				to: formatAddress(event.liquidator),
				amount: formatAmount(event.repayAssets),
				color: '#ff0040',
				icon: 'zap'
			})
		}
	})
	
	return steps
})

onMounted(() => {
	// Start animation
	const animate = () => {
		animationProgress.value += 0.02
		if (animationProgress.value < 1) {
			requestAnimationFrame(animate)
		}
	}
	
	setTimeout(() => {
		animate()
	}, 500)
})
</script>

<template>
	<div :class="$style.container">
		<Text size="16" weight="700" color="primary">TRANSACTION FLOW</Text>
		
		<div ref="flowContainer" :class="$style.flowChart">
			<div 
				v-for="(step, index) in flowSteps" 
				:key="step.id"
				:class="$style.flowStep"
				:style="{ 
					animationDelay: `${index * 0.3}s`,
					opacity: animationProgress > (index * 0.2) ? 1 : 0
				}"
			>
				<div :class="$style.stepNode" :style="{ borderColor: step.color }">
					<Icon :name="step.icon" size="16" :color="step.color.replace('#', '')" />
				</div>
				
				<div :class="$style.stepInfo">
					<Text size="12" weight="700" color="primary" style="text-transform: uppercase">
						{{ step.type }}
					</Text>
					<Text size="11" weight="500" color="secondary">
						{{ step.from }} → {{ step.to }}
					</Text>
					<Text size="13" weight="600" :color="step.color.replace('#', '')" mono>
						{{ step.amount }}
					</Text>
				</div>
				
				<div 
					v-if="index < flowSteps.length - 1"
					:class="$style.flowArrow"
					:style="{ 
						background: step.color,
						transform: `scaleX(${animationProgress > ((index + 1) * 0.2) ? 1 : 0})`
					}"
				/>
			</div>
		</div>
	</div>
</template>

<style module>
.container {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.flowChart {
	display: flex;
	flex-direction: column;
	gap: 20px;
	margin-top: 16px;
	position: relative;
}

.flowStep {
	display: flex;
	align-items: center;
	gap: 16px;
	position: relative;
	transition: all 0.5s ease;
}

.stepNode {
	width: 40px;
	height: 40px;
	border: 2px solid;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.8);
	flex-shrink: 0;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.1); }
}

.stepInfo {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.flowArrow {
	position: absolute;
	left: 20px;
	top: 50px;
	width: 2px;
	height: 20px;
	transform-origin: top;
	transition: transform 0.5s ease;
}

@media (max-width: 768px) {
	.flowChart {
		gap: 16px;
	}
	
	.stepNode {
		width: 32px;
		height: 32px;
	}
}
</style>