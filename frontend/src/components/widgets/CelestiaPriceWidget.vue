<script setup>
import { ref, onMounted, watch } from "vue"
import { DateTime } from "luxon"
import { fetchEarnHarvests } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const harvests = ref([])
const totalYield = ref(0)
const totalLoss = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(1)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(1)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(1)}K`
	return num.toFixed(2)
}

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

const loadData = async () => {
	try {
		const data = await fetchEarnHarvests(10)
		harvests.value = data.eulerEarnHarvests || []
		totalYield.value = harvests.value.reduce((acc, h) => acc + parseFloat(h.totalYield), 0)
		totalLoss.value = harvests.value.reduce((acc, h) => acc + parseFloat(h.totalLoss), 0)
	} catch (error) {
		console.error('Failed to load harvests:', error)
	}
}

onMounted(loadData)
watch(() => appStore.network, loadData)
</script>

<template>
	<Flex direction="column" justify="between" :class="$style.wrapper">
		<Flex wide justify="between">
			<Flex direction="column" gap="8">
				<Text size="16" weight="500" color="primary">Euler Earn Harvests</Text>
				<Text size="13" weight="500" color="tertiary">
					Total Loss: {{ formatAmount(totalLoss.toString()) }}
				</Text>
			</Flex>

			<Text size="18" weight="600" color="primary" mono>{{ formatAmount(totalYield.toString()) }}</Text>
		</Flex>

		<Flex direction="column" gap="8" :class="$style.harvests">
			<div v-for="harvest in harvests.slice(0, 5)" :key="harvest.id" :class="$style.harvest">
				<Flex justify="between" align="center">
					<Flex direction="column" gap="4">
						<Text size="14" weight="600" color="primary">
							{{ harvest.eulerEarnVault?.name || formatAddress(harvest.harvester) }}
						</Text>
						<Text size="12" weight="500" color="tertiary">
							{{ DateTime.fromSeconds(parseInt(harvest.blockTimestamp)).toRelative() }}
						</Text>
					</Flex>
					<Text size="14" weight="600" color="green">+{{ formatAmount(harvest.totalYield) }}</Text>
				</Flex>
			</div>
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	min-width: 500px;
	background: var(--card-background);
	padding: 20px;
}

.harvests {
	max-height: 200px;
	overflow-y: auto;
}

.harvest {
	padding: 12px;
	border-radius: 8px;
	background: var(--op-5);
	margin-bottom: 8px;
}
</style>