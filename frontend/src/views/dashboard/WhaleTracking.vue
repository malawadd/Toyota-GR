<script setup>
import { ref, onMounted, watch } from "vue"
import { fetchWhaleBalances } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const whales = ref([])

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(2)
}

const loadWhales = async () => {
	try {
		const minBalance = (1e6 * 1e18).toString() // 1M minimum
		const data = await fetchWhaleBalances("1000000000000000000000000")
		whales.value = data.trackingVaultBalances || []
	} catch (error) {
		console.error('Failed to load whale data:', error)
	}
}

onMounted(loadWhales)
watch(() => appStore.network, loadWhales)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Text size="24" weight="700" color="primary">WHALE TRACKING SYSTEM</Text>
				<div :class="$style.alertBadge">
					<Text size="11" weight="700" color="orange">HIGH VALUE ACCOUNTS</Text>
				</div>
			</Flex>

			<div :class="$style.grid">
				<div :class="$style.whaleCard">
					<Text size="14" weight="600" color="orange">WHALE COUNT</Text>
					<Text size="32" weight="700" color="orange" mono>{{ whales.length }}</Text>
				</div>

				<div :class="$style.balanceCard">
					<Text size="14" weight="600" color="tertiary">TOTAL WHALE BALANCE</Text>
					<Text size="32" weight="700" color="primary" mono>
						{{ formatAmount(whales.reduce((acc, w) => acc + parseFloat(w.balance), 0).toString()) }}
					</Text>
				</div>

				<div :class="$style.debtCard">
					<Text size="14" weight="600" color="red">TOTAL WHALE DEBT</Text>
					<Text size="32" weight="700" color="red" mono>
						{{ formatAmount(whales.reduce((acc, w) => acc + parseFloat(w.debt), 0).toString()) }}
					</Text>
				</div>
			</div>

			<div :class="$style.whaleList">
				<Text size="16" weight="700" color="primary">WHALE POSITIONS</Text>
				<div :class="$style.table">
					<div :class="$style.tableHeader">
						<Text size="12" weight="700" color="tertiary">ADDRESS</Text>
						<Text size="12" weight="700" color="tertiary">BALANCE</Text>
						<Text size="12" weight="700" color="tertiary">DEBT</Text>
						<Text size="12" weight="700" color="tertiary">RATIO</Text>
					</div>
					
					<div v-for="whale in whales.slice(0, 15)" :key="whale.id" :class="$style.whaleRow">
						<router-link :to="`/dashboard/account/${whale.mainAddress}`" :class="$style.accountLink">
							<Text size="13" weight="600" color="secondary" mono>
								{{ whale.mainAddress.slice(0, 12) }}...
							</Text>
						</router-link>
						<Text size="13" weight="600" color="green" mono>
							{{ formatAmount(whale.balance) }}
						</Text>
						<Text size="13" weight="600" color="red" mono>
							{{ formatAmount(whale.debt) }}
						</Text>
						<Text size="13" weight="600" color="primary" mono>
							{{ (parseFloat(whale.debt) / parseFloat(whale.balance) * 100).toFixed(1) }}%
						</Text>
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

.alertBadge {
	padding: 4px 8px;
	background: rgba(255, 165, 0, 0.2);
	border: 1px solid rgba(255, 165, 0, 0.5);
	border-radius: 4px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.whaleCard {
	background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.balanceCard {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.debtCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.whaleList {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 165, 0, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.table {
	margin-top: 16px;
}

.tableHeader {
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 165, 0, 0.2);
}

.whaleRow {
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	transition: background 0.2s ease;
}

.whaleRow:hover {
	background: rgba(255, 165, 0, 0.05);
}

.accountLink {
	text-decoration: none;
	color: inherit;
}

.accountLink:hover {
	opacity: 0.8;
}
</style>