<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { fetchVaultInterestAccrued, fetchVaultLatestTransaction, fetchVaultStatusByTxHash } from "@/services/api/vault"
import { useAppStore } from "@/stores/app"
import { DateTime } from "luxon"

const props = defineProps({
	vaultId: String
})

const appStore = useAppStore()
const interestEvents = ref([])
const vaultStatus = ref(null)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(6)
}

const formatTime = (timestamp) => {
	return DateTime.fromSeconds(parseInt(timestamp)).toRelative()
}

const loadInterestData = async () => {
	try {
		// Get interest accrued events
		const interestData = await fetchVaultInterestAccrued(props.vaultId, 30)
		interestEvents.value = interestData.interestAccrueds || []
		
		// Get latest vault status using the correct approach
		const transfersData = await fetchVaultLatestTransaction(props.vaultId)
		const latestTransfer = transfersData.transfers?.[0]
		
		if (latestTransfer) {
			const statusData = await fetchVaultStatusByTxHash(latestTransfer.transactionHash)
			vaultStatus.value = statusData.vaultStatuses?.[0] || null
		}
	} catch (error) {
		console.error('Failed to load vault interest data:', error)
	}
}

onMounted(loadInterestData)
watch(() => appStore.network, loadInterestData)
watch(() => props.vaultId, loadInterestData)

const totalInterestAccrued = computed(() => {
	return interestEvents.value.reduce((acc, event) => acc + parseFloat(event.assets), 0)
})

const currentInterestRate = computed(() => {
	return ((parseFloat(vaultStatus.value?.interestRate || '0') / 1e18) * 100).toFixed(4)
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Interest Metrics -->
			<div :class="$style.metricsGrid">
				<div :class="$style.rateCard">
					<Text size="14" weight="600" color="blue">CURRENT RATE</Text>
					<Text size="28" weight="700" color="blue" mono>{{ currentInterestRate }}%</Text>
				</div>

				<div :class="$style.accruedCard">
					<Text size="14" weight="600" color="green">TOTAL ACCRUED</Text>
					<Text size="28" weight="700" color="green" mono>
						{{ formatAmount(totalInterestAccrued.toString()) }}
					</Text>
				</div>

				<div :class="$style.eventsCard">
					<Text size="14" weight="600" color="purple">ACCRUAL EVENTS</Text>
					<Text size="28" weight="700" color="purple" mono>{{ interestEvents.length }}</Text>
				</div>

				<div :class="$style.feesCard">
					<Text size="14" weight="600" color="orange">ACCUMULATED FEES</Text>
					<Text size="28" weight="700" color="orange" mono>
						{{ formatAmount(vaultStatus?.accumulatedFees || '0') }}
					</Text>
				</div>
			</div>

			<!-- Interest Events -->
			<div :class="$style.eventsList">
				<Text size="16" weight="700" color="primary">RECENT INTEREST ACCRUALS</Text>
				
				<div v-if="interestEvents.length === 0" :class="$style.noData">
					<Text size="14" weight="600" color="tertiary">NO INTEREST EVENTS FOUND</Text>
				</div>

				<div v-else :class="$style.events">
					<div
						v-for="event in interestEvents"
						:key="event.id"
						:class="$style.interestEvent"
					>
						<Flex align="center" justify="between">
							<Flex direction="column" gap="4">
								<Text size="13" weight="600" color="green">INTEREST ACCRUED</Text>
								<Text size="11" weight="500" color="tertiary">
									{{ event.account.slice(0, 12) }}...
								</Text>
							</Flex>
							
							<Flex direction="column" gap="4" align="end">
								<Text size="14" weight="700" color="green" mono>
									+{{ formatAmount(event.assets) }}
								</Text>
								<Text size="11" weight="500" color="tertiary">
									{{ formatTime(event.blockTimestamp) }}
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
	max-width: 1200px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.rateCard {
	background: linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 170, 255, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.accruedCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.eventsCard {
	background: linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 255, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.feesCard {
	background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.eventsList {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.noData {
	text-align: center;
	padding: 40px;
}

.events {
	margin-top: 16px;
	max-height: 400px;
	overflow-y: auto;
}

.interestEvent {
	background: rgba(0, 255, 157, 0.05);
	border: 1px solid rgba(0, 255, 157, 0.1);
	border-radius: 6px;
	padding: 16px;
	margin-bottom: 8px;
	transition: all 0.2s ease;
}

.interestEvent:hover {
	background: rgba(0, 255, 157, 0.1);
	border-color: rgba(0, 255, 157, 0.3);
}
</style>