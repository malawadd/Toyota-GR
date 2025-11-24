<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { DateTime } from "luxon"
import { fetchTransactionDetails } from "@/services/api/transaction"
import { useAppStore } from "@/stores/app"
import { getExplorerURL } from "@/services/general"

// Components
import TransactionFlowChart from "@/components/transaction/TransactionFlowChart.vue"
import ValueDistributionChart from "@/components/transaction/ValueDistributionChart.vue"
import EventCard from "@/components/transaction/EventCard.vue"
import UtilizationGauge from "@/components/transaction/UtilizationGauge.vue"

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const txHash = computed(() => route.params.txHash)
const searchTxHash = ref(route.params.txHash || '')
const transactionData = ref(null)
const loading = ref(true)
const error = ref(null)
const queryErrors = ref([])

const formatAddress = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`

// Process all events from transaction data with error handling
const allEvents = computed(() => {
	if (!transactionData.value) return []
	
	const events = []
	const data = transactionData.value
	
	// Helper function to safely process events
	const safeProcess = (eventArray, type) => {
		try {
			if (Array.isArray(eventArray)) {
				eventArray.forEach(event => {
					events.push({ ...event, type })
				})
			}
		} catch (err) {
			console.warn(`Error processing ${type} events:`, err)
			queryErrors.value.push(`Failed to process ${type} events`)
		}
	}
	
	// Process different event types with error handling
	safeProcess(data.deposits, 'deposit')
	safeProcess(data.borrows, 'borrow')
	safeProcess(data.withdraws, 'withdraw')
	safeProcess(data.repays, 'repay')
	safeProcess(data.transfers, 'transfer')
	safeProcess(data.liquidates, 'liquidate')
	safeProcess(data.eulerSwaps, 'swap')
	safeProcess(data.eulerEarnDeposits, 'earn-deposit')
	safeProcess(data.eulerEarnWithdraws, 'earn-withdraw')
	safeProcess(data.eulerEarnHarvests, 'earn-harvest')
	
	// Sort by block timestamp with error handling
	try {
		return events.sort((a, b) => {
			const aTime = parseInt(a.blockTimestamp || '0')
			const bTime = parseInt(b.blockTimestamp || '0')
			return aTime - bTime
		})
	} catch (err) {
		console.warn('Error sorting events:', err)
		return events
	}
})

// Get transaction metadata with error handling
const transactionMeta = computed(() => {
	try {
		if (!allEvents.value.length) return null
		
		const firstEvent = allEvents.value[0]
		return {
			blockNumber: firstEvent.blockNumber,
			blockTimestamp: firstEvent.blockTimestamp,
			timestamp: DateTime.fromSeconds(parseInt(firstEvent.blockTimestamp))
		}
	} catch (err) {
		console.warn('Error processing transaction metadata:', err)
		return null
	}
})

// Get vault status if available with error handling
const vaultStatus = computed(() => {
	try {
		return transactionData.value?.vaultStatuses?.[0] || null
	} catch (err) {
		console.warn('Error processing vault status:', err)
		return null
	}
})

// Get swap data for charts with error handling
const swapData = computed(() => {
	try {
		return transactionData.value?.eulerSwaps || []
	} catch (err) {
		console.warn('Error processing swap data:', err)
		return []
	}
})

// Get earn data for charts with error handling
const earnData = computed(() => {
	try {
		return [
			...(transactionData.value?.eulerEarnDeposits || []),
			...(transactionData.value?.eulerEarnWithdraws || [])
		]
	} catch (err) {
		console.warn('Error processing earn data:', err)
		return []
	}
})

const loadTransactionData = async () => {
	loading.value = true
	error.value = null
	queryErrors.value = []
	transactionData.value = null

	if (!txHash.value) {
		loading.value = false
		return
	}
	
	try {
		const data = await fetchTransactionDetails(txHash.value)
		transactionData.value = data
		
		// Check if we got any data at all
		const hasAnyData = Object.values(data).some(value => 
			Array.isArray(value) && value.length > 0
		)
		
		if (!hasAnyData) {
			queryErrors.value.push('No events found for this transaction hash')
		}
		
	} catch (err) {
		console.error('Failed to load transaction details:', err)
		error.value = err.message
		queryErrors.value.push('Failed to fetch transaction data')
	} finally {
		loading.value = false
	}
}

const searchTransaction = () => {
	if (searchTxHash.value && searchTxHash.value !== txHash.value) {
		router.push({ name: 'transaction-detail', params: { txHash: searchTxHash.value } })
	}
}

const openInExplorer = () => {
	window.open(`${getExplorerURL(appStore.network)}/tx/${txHash.value}`, '_blank', 'noopener noreferrer')
}

const goToSearch = () => {
	router.push({ name: 'transaction-search' })
}

onMounted(loadTransactionData)
watch(() => txHash.value, (newVal) => {
	searchTxHash.value = newVal || ''
	loadTransactionData()
})
watch(() => appStore.network, loadTransactionData)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Header -->
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">TRANSACTION ANALYSIS</Text>
					<Text size="14" weight="600" color="secondary" mono>{{ txHash }}</Text>
				</Flex>
				
				<Flex align="center" gap="12">
					<!-- Search Bar -->
					<div :class="$style.searchBar">
						<input
							type="text"
							v-model="searchTxHash"
							@keyup.enter="searchTransaction"
							placeholder="Enter transaction hash"
							:class="$style.searchInput"
						/>
						<button @click="searchTransaction" :class="$style.searchButton">
							<Icon name="arrow-top-right" size="16" color="primary" />
						</button>
					</div>

					<!-- External Explorer Link -->
					<button @click="openInExplorer" :class="$style.explorerLink">
						<Icon name="arrow-top-right" size="16" color="secondary" />
						<Text size="12" weight="700" color="secondary">EXPLORER</Text>
					</button>

					<!-- Back to Search -->
					<button @click="goToSearch" :class="$style.backLink">
						<Icon name="arrow-top-right" size="16" color="secondary" :rotate="180" />
						<Text size="12" weight="700" color="secondary">SEARCH</Text>
					</button>
				</Flex>
			</Flex>

			<!-- Query Errors Warning -->
			<div v-if="queryErrors.length > 0" :class="$style.warningCard">
				<Icon name="zap" size="20" color="orange" />
				<Flex direction="column" gap="8">
					<Text size="14" weight="600" color="orange">PARTIAL DATA LOADED</Text>
					<Text size="12" weight="500" color="tertiary">
						Some queries failed but available data is shown below.
					</Text>
					<div v-for="errorMsg in queryErrors" :key="errorMsg" :class="$style.errorItem">
						<Text size="11" weight="500" color="support">• {{ errorMsg }}</Text>
					</div>
				</Flex>
			</div>

			<!-- Loading State -->
			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">ANALYZING TRANSACTION...</Text>
			</div>

			<!-- Error State -->
			<div v-else-if="error && !transactionData" :class="$style.errorCard">
				<Icon name="zap" size="24" color="red" />
				<Text size="16" weight="600" color="red">FAILED TO LOAD TRANSACTION</Text>
				<Text size="14" weight="500" color="tertiary">{{ error }}</Text>
				<Flex gap="12">
					<button @click="loadTransactionData" :class="$style.retryButton">
						<Text size="12" weight="700" color="secondary">RETRY</Text>
					</button>
					<button @click="goToSearch" :class="$style.retryButton">
						<Text size="12" weight="700" color="secondary">NEW SEARCH</Text>
					</button>
				</Flex>
			</div>

			<!-- Transaction Content -->
			<div v-else-if="allEvents.length > 0">
				<!-- Transaction Overview -->
				<div :class="$style.overviewCard">
					<Flex align="center" justify="between">
						<Flex direction="column" gap="8">
							<Text size="18" weight="700" color="primary">TRANSACTION OVERVIEW</Text>
							<Flex align="center" gap="16" v-if="transactionMeta">
								<Text size="12" weight="500" color="tertiary">
									Block: {{ transactionMeta.blockNumber }}
								</Text>
								<Text size="12" weight="500" color="tertiary">
									{{ transactionMeta.timestamp.toFormat('MMM dd, yyyy HH:mm:ss') }}
								</Text>
								<Text size="12" weight="500" color="tertiary">
									{{ transactionMeta.timestamp.toRelative() }}
								</Text>
							</Flex>
						</Flex>
						
						<div :class="$style.eventCount">
							<Text size="24" weight="700" color="green" mono>{{ allEvents.length }}</Text>
							<Text size="11" weight="500" color="tertiary">EVENTS</Text>
						</div>
					</Flex>
				</div>

				<!-- Charts Section -->
				<div v-if="swapData.length > 0 || earnData.length > 0 || vaultStatus" :class="$style.chartsGrid">
					<TransactionFlowChart :events="allEvents" :txHash="txHash" />
					
					<ValueDistributionChart 
						v-if="swapData.length > 0 || earnData.length > 0"
						:swapData="swapData" 
						:earnData="earnData" 
					/>
					
					<UtilizationGauge 
						v-if="vaultStatus"
						:vaultStatus="vaultStatus" 
					/>
				</div>

				<!-- Events Grid -->
				<div :class="$style.eventsSection">
					<Text size="18" weight="700" color="primary">TRANSACTION EVENTS</Text>
					
					<div :class="$style.eventsGrid">
						<EventCard
							v-for="(event, index) in allEvents"
							:key="event.id || index"
							:event="event"
							:type="event.type"
							:index="index"
						/>
					</div>
				</div>
			</div>

			<!-- No Events State -->
			<div v-else :class="$style.noEventsCard">
				<Icon name="check-circle" size="48" color="tertiary" />
				<Text size="18" weight="700" color="tertiary">NO EVENTS FOUND</Text>
				<Text size="14" weight="500" color="support">
					This transaction hash doesn't contain any tracked events on {{ appStore.network }}.
				</Text>
				<button @click="goToSearch" :class="$style.searchAgainButton">
					<Text size="12" weight="700" color="secondary">SEARCH ANOTHER TRANSACTION</Text>
				</button>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
}

.searchBar {
	display: flex;
	align-items: center;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 6px;
	padding: 4px;
}

.searchInput {
	background: transparent;
	border: none;
	color: var(--txt-primary);
	padding: 6px 10px;
	font-size: 14px;
	flex-grow: 1;
	min-width: 200px;
	font-family: monospace;
}

.searchInput::placeholder {
	color: var(--txt-tertiary);
}

.searchButton {
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 4px;
	padding: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.searchButton:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

.explorerLink, .backLink {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border: 1px solid;
	border-radius: 6px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.explorerLink {
	background: rgba(0, 170, 255, 0.1);
	border-color: rgba(0, 170, 255, 0.3);
}

.explorerLink:hover {
	background: rgba(0, 170, 255, 0.2);
	box-shadow: 0 0 15px rgba(0, 170, 255, 0.3);
}

.backLink {
	background: rgba(255, 0, 255, 0.1);
	border-color: rgba(255, 0, 255, 0.3);
}

.backLink:hover {
	background: rgba(255, 0, 255, 0.2);
	box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
}

.warningCard {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
	background: rgba(255, 165, 0, 0.1);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 8px;
}

.errorItem {
	margin-left: 8px;
}

.loadingCard {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 48px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
}

.loadingSpinner {
	width: 32px;
	height: 32px;
	border: 3px solid rgba(0, 255, 157, 0.2);
	border-top: 3px solid #00ff9d;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.errorCard {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 48px;
	background: rgba(255, 0, 0, 0.1);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
}

.retryButton, .searchAgainButton {
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 4px;
	padding: 8px 16px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.retryButton:hover, .searchAgainButton:hover {
	background: rgba(255, 255, 255, 0.2);
}

.overviewCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.eventCount {
	text-align: center;
	padding: 16px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
}

.chartsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 20px;
}

.eventsSection {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.eventsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 16px;
}

.noEventsCard {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 48px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	text-align: center;
}

@media (max-width: 768px) {
	.chartsGrid {
		grid-template-columns: 1fr;
	}
	
	.eventsGrid {
		grid-template-columns: 1fr;
	}
}
</style>