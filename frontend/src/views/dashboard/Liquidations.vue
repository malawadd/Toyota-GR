<script setup>
import { ref, onMounted, watch } from "vue"
import { fetchLiquidations } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const liquidations = ref([])

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(2)
}

const loadLiquidations = async () => {
	try {
		const since = Math.floor(Date.now() / 1000) - (24 * 60 * 60)
		const data = await fetchLiquidations(since.toString())
		liquidations.value = data.liquidates || []
	} catch (error) {
		console.error('Failed to load liquidations:', error)
	}
}

onMounted(loadLiquidations)
watch(() => appStore.network, loadLiquidations)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Text size="24" weight="700" color="primary">LIQUIDATION MONITORING</Text>

			<div :class="$style.grid">
				<div :class="$style.alertCard">
					<Text size="14" weight="600" color="red">LIQUIDATIONS (24H)</Text>
					<Text size="32" weight="700" color="red" mono>{{ liquidations.length }}</Text>
				</div>

				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">TOTAL VALUE</Text>
					<Text size="32" weight="700" color="primary" mono>
						{{ formatAmount(liquidations.reduce((acc, liq) => acc + parseFloat(liq.repayAssets), 0).toString()) }}
					</Text>
				</div>
			</div>

			<div :class="$style.tableCard">
				<Text size="16" weight="700" color="primary">LIQUIDATION EVENTS</Text>
				<div :class="$style.table">
					<div v-for="liq in liquidations.slice(0, 15)" :key="liq.id" :class="$style.liquidationRow">
						<Flex align="center" justify="between">
							<Flex direction="column" gap="4">
								<router-link :to="`/dashboard/transaction/${liq.transactionHash}`" :class="$style.txLink">
									<Text size="13" weight="600" color="red" mono>
										LIQUIDATED: {{ liq.violator.slice(0, 10) }}...
									</Text>
								</router-link>
								<router-link :to="`/dashboard/transaction/${liq.transactionHash}`" :class="$style.txLink">
									<Text size="11" weight="500" color="tertiary">
										BY: {{ liq.liquidator.slice(0, 10) }}...
									</Text>
								</router-link>
							</Flex>
							<Text size="14" weight="700" color="primary" mono>
								{{ formatAmount(liq.repayAssets) }}
							</Text>
						</Flex>
					</div>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 20px;
}

.card {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.alertCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
	position: relative;
}

.alertCard::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: #ff0000;
	animation: pulse 2s infinite;
}

.tableCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.table {
	margin-top: 16px;
	max-height: 400px;
	overflow-y: auto;
}

.liquidationRow {
	padding: 16px;
	margin-bottom: 8px;
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.1);
	border-radius: 6px;
	transition: all 0.2s ease;
}

.liquidationRow:hover {
	background: rgba(255, 0, 0, 0.1);
	border-color: rgba(255, 0, 0, 0.3);
}

.txLink {
	text-decoration: none;
	color: inherit;
}

.txLink:hover {
	opacity: 0.8;
}
</style>