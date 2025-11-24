<script setup>
import { ref, watch, onMounted } from "vue"
import { DateTime } from "luxon"
import { fetchLatestTransactions } from "@/services/api/euler"
import { getExplorerURL } from "@/services/general"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const transactions = ref([])

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`
const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	return num > 1000 ? `${(num/1000).toFixed(1)}K` : num.toFixed(2)
}

const getTransactionType = (tx) => {
	if (tx.assets && tx.shares) return tx.sender ? 'Deposit' : 'Withdraw'
	if (tx.assets && !tx.shares) return 'Borrow'
	return 'Unknown'
}

const loadTransactions = async () => {
	try {
		const data = await fetchLatestTransactions(20)
		const allTxs = [
			...data.deposits.map(tx => ({ ...tx, type: 'Deposit' })),
			...data.borrows.map(tx => ({ ...tx, type: 'Borrow' })),
			...data.withdraws.map(tx => ({ ...tx, type: 'Withdraw' }))
		]
		transactions.value = allTxs.sort((a, b) => b.blockTimestamp - a.blockTimestamp).slice(0, 20)
	} catch (error) {
		console.error('Failed to load transactions:', error)
	}
}

onMounted(loadTransactions)
watch(() => appStore.network, loadTransactions)
</script>

<template>
	<Flex direction="column" gap="16" :class="$style.wrapper">
		<Text size="12" weight="600" color="tertiary">Latest Transactions</Text>

		<router-link
			v-for="tx in transactions"
			:key="tx.id"
			gap="8"
			:to="`/dashboard/transaction/${tx.transactionHash}`"
			:class="$style.transactionLink"
		>
			<Flex gap="8">
				<Flex direction="column" align="center" gap="8">
					<div :class="$style.circle" />
					<div :class="$style.line" />
				</Flex>

				<Flex direction="column" gap="6">
					<Flex align="center" gap="6">
						<Text size="14" weight="600" color="primary" mono style="text-transform: uppercase">
							<Text color="secondary" style="text-transform: capitalize">{{ tx.type }}</Text> 
							<router-link :to="`/dashboard/account/${tx.sender || tx.account || tx.owner}`" :class="$style.accountLink">
								{{ formatAddress(tx.sender || tx.account || tx.owner) }}
							</router-link>
						</Text>
						<Icon name="arrow-top-right" size="14" color="tertiary" />
					</Flex>
					<Text size="14" weight="500" height="140" color="tertiary" mono>
						{{ formatAddress(tx.vault) }}
					</Text>
					<Text size="13" weight="600" color="support" mono :class="$style.when">
						Amount: {{ formatAmount(tx.assets || '0') }}
					</Text>
				</Flex>
			</Flex>
		</router-link>
	</Flex>
</template>

<style module>
.wrapper {
	max-width: 300px;
	flex: 1;
	overflow: auto;
	min-height: 0;
}

.wrapper::-webkit-scrollbar {
	display: none;
}

.circle {
	min-width: 10px;
	min-height: 10px;
	border-radius: 50%;
	border: 2px solid var(--green);
	margin-top: 3px;
}

.line {
	width: 2px;
	height: 100%;
	background: var(--op-5);
}

.when {
	margin-bottom: 14px;
}

.transactionLink {
	text-decoration: none;
	color: inherit;
}

.transactionLink:hover {
	opacity: 0.8;
}

.accountLink {
	text-decoration: none;
	color: inherit;
}

.accountLink:hover {
	opacity: 0.8;
}
</style>