<script setup>
import { ref, watch, onMounted } from "vue"
import { DateTime } from "luxon"
import { fetchLiquidations } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const liquidations = ref([])
const total = ref(0)
const totalValue = ref(0)

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	return num > 1000 ? `${(num/1000).toFixed(1)}K` : num.toFixed(2)
}

const getData = async () => {
	try {
		const since = Math.floor(Date.now() / 1000) - (24 * 60 * 60 * 7) // 24h ago
		const data = await fetchLiquidations(since.toString())
		liquidations.value = data.liquidates || []
		total.value = liquidations.value.length
		totalValue.value = liquidations.value.reduce((acc, liq) => acc + parseFloat(liq.repayAssets), 0)
	} catch (error) {
		console.error('Failed to load liquidations:', error)
	}
}

onMounted(getData)
watch(() => appStore.network, getData)
</script>

<template>
	<Flex direction="column" gap="24" :class="$style.wrapper">
		<Text size="16" weight="600" color="primary">Liquidations (7d)</Text>

		<Flex align="center" gap="40">
			<Flex direction="column" gap="8">
				<Text size="24" weight="500" color="primary" mono>{{ total }}</Text>
				<Text size="14" weight="500" color="tertiary">Total Count</Text>
			</Flex>

			<Flex direction="column" gap="8">
				<Text size="24" weight="500" color="primary" mono>{{ formatAmount(totalValue.toString()) }}</Text>
				<Text size="14" weight="500" color="tertiary">Total Value</Text>
			</Flex>
		</Flex>

		<Flex direction="column" gap="8" :class="$style.liquidations">
			<div v-for="(liq, idx) in liquidations.slice(0, 8)" :key="liq.id">
				<Flex align="center" justify="between" :class="$style.liquidation">
					<Flex align="center" gap="12">
						<Text size="16" weight="500" color="tertiary" :class="$style.counter">{{ idx + 1 }}</Text>

						<Flex direction="column" gap="6">
							<Text size="14" weight="600" color="primary">{{ formatAddress(liq.violator) }}</Text>
							<Text size="13" weight="500" color="tertiary">
								{{ DateTime.fromSeconds(parseInt(liq.blockTimestamp)).toRelative() }}
							</Text>
						</Flex>
					</Flex>

					<Text size="14" weight="600" color="primary">{{ formatAmount(liq.repayAssets) }}</Text>
				</Flex>
			</div>
		</Flex>

		<Text size="12" weight="500" color="support">Updates every 5 minutes</Text>
	</Flex>
</template>

<style module>
.wrapper {
	height: 100%;
	background: var(--card-background);
	padding: 20px;
}

.liquidations {
	flex: 1;
}

.liquidation {
	min-height: 60px;
	box-shadow: 0 0 0 2px var(--op-5);
	border-radius: 8px;
	padding: 0 16px;
}

.counter {
	min-width: 20px;
}

@media (max-width: 1500px) {
	.wrapper {
		height: initial;
	}
}
</style>