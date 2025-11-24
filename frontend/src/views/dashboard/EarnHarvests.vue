<script setup>
import { ref, onMounted, watch } from "vue"
import { fetchEarnHarvests } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const harvests = ref([])

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(2)
}

const loadHarvests = async () => {
	try {
		const data = await fetchEarnHarvests(50)
		harvests.value = data.eulerEarnHarvests || []
	} catch (error) {
		console.error('Failed to load harvests:', error)
	}
}

onMounted(loadHarvests)
watch(() => appStore.network, loadHarvests)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Text size="24" weight="700" color="primary">EARN HARVEST MONITORING</Text>

			<div :class="$style.grid">
				<div :class="$style.yieldCard">
					<Text size="14" weight="600" color="green">TOTAL YIELD</Text>
					<Text size="32" weight="700" color="green" mono>
						{{ formatAmount(harvests.reduce((acc, h) => acc + parseFloat(h.totalYield), 0).toString()) }}
					</Text>
				</div>

				<div :class="$style.lossCard">
					<Text size="14" weight="600" color="red">TOTAL LOSS</Text>
					<Text size="32" weight="700" color="red" mono>
						{{ formatAmount(harvests.reduce((acc, h) => acc + parseFloat(h.totalLoss), 0).toString()) }}
					</Text>
				</div>

				<div :class="$style.harvestCard">
					<Text size="14" weight="600" color="tertiary">HARVEST COUNT</Text>
					<Text size="32" weight="700" color="primary" mono>{{ harvests.length }}</Text>
				</div>
			</div>

			<div :class="$style.harvestList">
				<Text size="16" weight="700" color="primary">RECENT HARVESTS</Text>
				<div :class="$style.list">
					<div v-for="harvest in harvests.slice(0, 20)" :key="harvest.id" :class="$style.harvestItem">
						<Flex align="center" justify="between">
							<Flex direction="column" gap="4">
								<router-link :to="`/dashboard/transaction/${harvest.transactionHash}`" :class="$style.txLink">
									<Text size="13" weight="600" color="secondary" mono>
										{{ harvest.harvester.slice(0, 12) }}...
									</Text>
								</router-link>
								<Text size="11" weight="500" color="tertiary">
									{{ harvest.eulerEarnVault?.name || 'Unknown Vault' }}
								</Text>
							</Flex>
							
							<Flex direction="column" gap="4" align="end">
								<Text size="13" weight="600" color="green" mono>
									+{{ formatAmount(harvest.totalYield) }}
								</Text>
								<Text size="11" weight="500" color="red" mono>
									-{{ formatAmount(harvest.totalLoss) }}
								</Text>
							</Flex>
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
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.yieldCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.lossCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.harvestCard {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.harvestList {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.list {
	margin-top: 16px;
	max-height: 500px;
	overflow-y: auto;
}

.harvestItem {
	padding: 16px;
	margin-bottom: 8px;
	background: rgba(0, 255, 157, 0.05);
	border: 1px solid rgba(0, 255, 157, 0.1);
	border-radius: 6px;
	transition: all 0.2s ease;
}

.harvestItem:hover {
	background: rgba(0, 255, 157, 0.1);
	border-color: rgba(0, 255, 157, 0.3);
}

.txLink {
	text-decoration: none;
	color: inherit;
}

.txLink:hover {
	opacity: 0.8;
}
</style>