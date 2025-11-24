<script setup>
import { ref, computed, onMounted } from "vue"

const props = defineProps({
	accountData: Object
})

const chartContainer = ref(null)
const animationProgress = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

// Process cash flow data
const cashFlowData = computed(() => {
	if (!props.accountData) return { inflows: 0, outflows: 0, net: 0 }
	
	let inflows = 0
	let outflows = 0
	
	// Calculate inflows (deposits, transfers in)
	props.accountData.deposits?.forEach(deposit => {
		inflows += parseFloat(deposit.assets || '0')
	})
	
	props.accountData.transfers?.forEach(transfer => {
		if (transfer.to === props.accountData.accountId) {
			inflows += parseFloat(transfer.value || '0')
		}
	})
	
	// Calculate outflows (withdraws, transfers out)
	props.accountData.withdraws?.forEach(withdraw => {
		outflows += parseFloat(withdraw.assets || '0')
	})
	
	props.accountData.transfers?.forEach(transfer => {
		if (transfer.from === props.accountData.accountId) {
			outflows += parseFloat(transfer.value || '0')
		}
	})
	
	return {
		inflows,
		outflows,
		net: inflows - outflows
	}
})

// Create chart bars data
const chartBars = computed(() => {
	const maxValue = Math.max(cashFlowData.value.inflows, cashFlowData.value.outflows)
	if (maxValue === 0) return []
	
	return [
		{
			label: 'INFLOWS',
			value: cashFlowData.value.inflows,
			height: (cashFlowData.value.inflows / maxValue) * 100,
			color: '#00ff9d'
		},
		{
			label: 'OUTFLOWS',
			value: cashFlowData.value.outflows,
			height: (cashFlowData.value.outflows / maxValue) * 100,
			color: '#ff0040'
		}
	]
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
		<Text size="16" weight="700" color="primary">CASH FLOW ANALYSIS</Text>
		
		<div ref="chartContainer" :class="$style.chart">
			<div :class="$style.barsContainer">
				<div
					v-for="(bar, index) in chartBars"
					:key="bar.label"
					:class="$style.barWrapper"
				>
					<div :class="$style.barTrack">
						<div
							:class="$style.bar"
							:style="{
								height: `${bar.height * animationProgress}%`,
								background: bar.color,
								boxShadow: `0 0 10px ${bar.color}`
							}"
						/>
					</div>
					
					<div :class="$style.barLabel">
						<Text size="11" weight="600" color="tertiary">{{ bar.label }}</Text>
						<Text size="13" weight="700" color="primary" mono>
							{{ formatAmount(bar.value.toString()) }}
						</Text>
					</div>
				</div>
			</div>
			
			<div :class="$style.netFlow">
				<Text size="12" weight="600" color="tertiary">NET FLOW</Text>
				<Text 
					size="18" 
					weight="700" 
					:color="cashFlowData.net >= 0 ? 'green' : 'red'" 
					mono
				>
					{{ cashFlowData.net >= 0 ? '+' : '' }}{{ formatAmount(cashFlowData.net.toString()) }}
				</Text>
			</div>
		</div>
		
		<div :class="$style.summary">
			<div :class="$style.summaryItem">
				<Text size="11" weight="600" color="tertiary">DEPOSITS</Text>
				<Text size="12" weight="600" color="green">
					{{ props.accountData?.deposits?.length || 0 }}
				</Text>
			</div>
			
			<div :class="$style.summaryItem">
				<Text size="11" weight="600" color="tertiary">WITHDRAWS</Text>
				<Text size="12" weight="600" color="red">
					{{ props.accountData?.withdraws?.length || 0 }}
				</Text>
			</div>
			
			<div :class="$style.summaryItem">
				<Text size="11" weight="600" color="tertiary">TRANSFERS</Text>
				<Text size="12" weight="600" color="blue">
					{{ props.accountData?.transfers?.length || 0 }}
				</Text>
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

.chart {
	margin: 16px 0;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.barsContainer {
	display: flex;
	align-items: end;
	gap: 24px;
	height: 120px;
}

.barWrapper {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.barTrack {
	width: 40px;
	height: 80px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 4px;
	position: relative;
	overflow: hidden;
}

.bar {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	border-radius: 4px;
	transition: height 1s ease;
}

.barLabel {
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.netFlow {
	text-align: center;
	padding: 12px;
	background: rgba(255, 255, 255, 0.02);
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.05);
}

.summary {
	display: flex;
	justify-content: space-around;
	padding-top: 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.summaryItem {
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 4px;
}
</style>