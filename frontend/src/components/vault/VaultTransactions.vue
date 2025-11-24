<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { fetchVaultDeposits, fetchVaultWithdraws, fetchVaultBorrows, fetchVaultRepays } from "@/services/api/vault"
import { useAppStore } from "@/stores/app"
import { DateTime } from "luxon"

const props = defineProps({
	vaultId: String
})

const appStore = useAppStore()
const deposits = ref([])
const withdraws = ref([])
const borrows = ref([])
const repays = ref([])
const activeFilter = ref('all')

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatTime = (timestamp) => {
	return DateTime.fromSeconds(parseInt(timestamp)).toRelative()
}

const loadTransactions = async () => {
	try {
		const [depositsData, withdrawsData, borrowsData, repaysData] = await Promise.all([
			fetchVaultDeposits(props.vaultId, 20),
			fetchVaultWithdraws(props.vaultId, 20),
			fetchVaultBorrows(props.vaultId, 20),
			fetchVaultRepays(props.vaultId, 20)
		])
		
		deposits.value = depositsData.deposits || []
		withdraws.value = withdrawsData.withdraws || []
		borrows.value = borrowsData.borrows || []
		repays.value = repaysData.repays || []
	} catch (error) {
		console.error('Failed to load vault transactions:', error)
	}
}

const allTransactions = computed(() => {
	const all = [
		...deposits.value.map(tx => ({ ...tx, type: 'DEPOSIT', color: 'green' })),
		...withdraws.value.map(tx => ({ ...tx, type: 'WITHDRAW', color: 'red' })),
		...borrows.value.map(tx => ({ ...tx, type: 'BORROW', color: 'orange' })),
		...repays.value.map(tx => ({ ...tx, type: 'REPAY', color: 'blue' }))
	]
	
	return all.sort((a, b) => b.blockTimestamp - a.blockTimestamp)
})

const filteredTransactions = computed(() => {
	if (activeFilter.value === 'all') return allTransactions.value
	return allTransactions.value.filter(tx => tx.type.toLowerCase() === activeFilter.value)
})

onMounted(loadTransactions)
watch(() => appStore.network, loadTransactions)
watch(() => props.vaultId, loadTransactions)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Filter Tabs -->
			<div :class="$style.filterTabs">
				<div
					v-for="filter in ['all', 'deposit', 'withdraw', 'borrow', 'repay']"
					:key="filter"
					@click="activeFilter = filter"
					:class="[$style.filterTab, activeFilter === filter && $style.activeFilter]"
				>
					<Text size="12" weight="700" color="secondary" style="text-transform: uppercase">
						{{ filter }}
					</Text>
				</div>
			</div>

			<!-- Transaction Stats -->
			<div :class="$style.statsGrid">
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="green">DEPOSITS</Text>
					<Text size="20" weight="700" color="green" mono>{{ deposits.length }}</Text>
				</div>
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="red">WITHDRAWS</Text>
					<Text size="20" weight="700" color="red" mono>{{ withdraws.length }}</Text>
				</div>
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="orange">BORROWS</Text>
					<Text size="20" weight="700" color="orange" mono>{{ borrows.length }}</Text>
				</div>
				<div :class="$style.statCard">
					<Text size="12" weight="600" color="blue">REPAYS</Text>
					<Text size="20" weight="700" color="blue" mono>{{ repays.length }}</Text>
				</div>
			</div>

			<!-- Transaction List -->
			<div :class="$style.transactionList">
				<div :class="$style.listHeader">
					<Text size="12" weight="700" color="tertiary">TYPE</Text>
					<Text size="12" weight="700" color="tertiary">ACCOUNT</Text>
					<Text size="12" weight="700" color="tertiary">AMOUNT</Text>
					<Text size="12" weight="700" color="tertiary">TIME</Text>
				</div>
				
				<div :class="$style.transactions">
					<div
						v-for="tx in filteredTransactions.slice(0, 50)"
						:key="tx.id"
						:class="$style.transactionRow"
					>
						<div :class="$style.typeTag" :style="{ borderColor: `var(--${tx.color})` }">
							<Text size="11" weight="700" :color="tx.color">{{ tx.type }}</Text>
						</div>
						
						<!-- <Text size="12" weight="600" color="secondary" mono>
							{{ (tx.sender || tx.account || tx.owner)?.slice(0, 10) }}...
						</Text> -->
						
						<router-link :to="`/dashboard/account/${tx.sender || tx.account || tx.owner}`" :class="$style.accountLink">
							<Text size="13" weight="600" color="secondary" mono>
								{{ (tx.sender || tx.account || tx.owner)?.slice(0, 10) }}...
							</Text>
						</router-link>
						
						<Text size="12" weight="600" color="primary" mono>
							{{ formatAmount(tx.assets || '0') }}
						</Text>
						
						<Text size="11" weight="500" color="tertiary">
							{{ formatTime(tx.blockTimestamp) }}
						</Text>
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

.filterTabs {
	display: flex;
	gap: 4px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 4px;
}

.filterTab {
	padding: 8px 16px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	flex: 1;
	text-align: center;
}

.filterTab:hover {
	background: rgba(0, 255, 255, 0.05);
}

.activeFilter {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 255, 157, 0.1) 100%);
	border: 1px solid rgba(0, 255, 255, 0.3);
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
}

.statCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	text-align: center;
}

.transactionList {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 20px;
}

.listHeader {
	display: grid;
	grid-template-columns: 100px 1fr 120px 100px;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(0, 255, 157, 0.2);
}

.transactions {
	max-height: 400px;
	overflow-y: auto;
}

.transactionRow {
	display: grid;
	grid-template-columns: 100px 1fr 120px 100px;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	align-items: center;
}

.typeTag {
	padding: 4px 8px;
	border: 1px solid;
	border-radius: 4px;
	text-align: center;
	background: rgba(0, 0, 0, 0.3);
}

.accountLink {
	text-decoration: none;
	color: inherit;
}

.accountLink:hover {
	opacity: 0.8;
}
</style>