<script setup>
import { ref, onMounted, watch } from "vue"
import { fetchSwaps } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const swaps = ref([])
const loading = ref(true)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const loadSwaps = async () => {
	loading.value = true
	try {
		const since = Math.floor(Date.now() / 1000) - (24 * 60 * 60)
		const data = await fetchSwaps(since.toString())
		swaps.value = data.eulerSwaps || []
	} catch (error) {
		console.error('Failed to load swaps:', error)
	} finally {
		loading.value = false
	}
}

onMounted(loadSwaps)
watch(() => appStore.network, loadSwaps)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Text size="24" weight="700" color="primary">SWAP POSITIONS ANALYSIS</Text>
				<div :class="$style.statusBadge">
					<Text size="11" weight="700" color="green">REAL-TIME</Text>
				</div>
			</Flex>

			<div :class="$style.grid">
				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">TOTAL SWAPS (24H)</Text>
					<Text size="32" weight="700" color="primary" mono>{{ swaps.length }}</Text>
				</div>

				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">ACTIVE POOLS</Text>
					<Text size="32" weight="700" color="primary" mono>
						{{ new Set(swaps.map(s => s.pool)).size }}
					</Text>
				</div>
			</div>

			<div :class="$style.tableCard">
				<Text size="16" weight="700" color="primary">RECENT SWAP ACTIVITY</Text>
				<div :class="$style.table">
					<div :class="$style.tableHeader">
						<Text size="12" weight="700" color="tertiary">SENDER</Text>
						<Text size="12" weight="700" color="tertiary">AMOUNT IN</Text>
						<Text size="12" weight="700" color="tertiary">AMOUNT OUT</Text>
						<Text size="12" weight="700" color="tertiary">POOL</Text>
					</div>
					<div v-for="swap in swaps.slice(0, 10)" :key="swap.id" :class="$style.tableRow">
						<router-link :to="`/dashboard/transaction/${swap.transactionHash}`" :class="$style.txLink">
							<Text size="13" weight="600" color="secondary" mono>
								{{ swap.sender.slice(0, 8) }}...
							</Text>
						</router-link>
						<Text size="13" weight="600" color="primary" mono>
							{{ formatAmount(swap.amount0In || swap.amount1In) }}
						</Text>
						<Text size="13" weight="600" color="green" mono>
							{{ formatAmount(swap.amount0Out || swap.amount1Out) }}
						</Text>
						<router-link :to="`/dashboard/transaction/${swap.transactionHash}`" :class="$style.txLink">
							<Text size="13" weight="600" color="secondary" mono>
								{{ swap.pool.slice(0, 8) }}...
							</Text>
						</router-link>
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

.statusBadge {
	padding: 4px 8px;
	background: rgba(0, 255, 157, 0.2);
	border: 1px solid rgba(0, 255, 157, 0.5);
	border-radius: 4px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 20px;
}

.card {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
	position: relative;
	overflow: hidden;
}

.card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 2px;
	background: linear-gradient(90deg, #00ff9d, #00ffff);
}

.tableCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.table {
	margin-top: 16px;
}

.tableHeader {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.tableRow {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	transition: background 0.2s ease;
}

.tableRow:hover {
	background: rgba(0, 255, 255, 0.05);
}

.txLink {
	text-decoration: none;
	color: inherit;
}

.txLink:hover {
	opacity: 0.8;
}
</style>