<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { DateTime } from "luxon"
import { fetchAccountDetails } from "@/services/api/account"
import { useAppStore } from "@/stores/app"
import { getExplorerURL } from "@/services/general"

// Components
import CashFlowChart from "@/components/account/CashFlowChart.vue"
import LiquidationHistory from "@/components/account/LiquidationHistory.vue"
import AccountVaultsList from "@/components/account/AccountVaultsList.vue"

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const accountId = computed(() => route.params.accountId)
const searchAccountId = ref(route.params.accountId || '')
const accountData = ref(null)
const loading = ref(true)
const error = ref(null)
const activeTab = ref('overview')

const tabs = [
	{ key: 'overview', name: 'OVERVIEW', icon: 'coins' },
	{ key: 'transactions', name: 'TRANSACTIONS', icon: 'arrow-top-right' },
	{ key: 'debt', name: 'DEBT', icon: 'blob' },
	{ key: 'liquidations', name: 'LIQUIDATIONS', icon: 'zap' },
	{ key: 'earn-swap', name: 'EARN & SWAP', icon: 'zap-circle' }
]

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatAddress = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`

// Process current balances from trackingVaultBalances
const currentBalances = computed(() => {
	if (!accountData.value?.trackingVaultBalances) return []
	
	// Group by vault and get latest balance for each
	const vaultBalances = new Map()
	
	accountData.value.trackingVaultBalances.forEach(balance => {
		const vaultId = balance.vault
		const existing = vaultBalances.get(vaultId)
		
		if (!existing || parseInt(balance.blockTimestamp) > parseInt(existing.blockTimestamp)) {
			vaultBalances.set(vaultId, balance)
		}
	})
	
	return Array.from(vaultBalances.values())
})

// Calculate total balance and debt
const totalBalance = computed(() => {
	return currentBalances.value.reduce((acc, balance) => acc + parseFloat(balance.balance), 0)
})

const totalDebt = computed(() => {
	return currentBalances.value.reduce((acc, balance) => acc + parseFloat(balance.debt), 0)
})

// Get all transactions for the transactions tab
const allTransactions = computed(() => {
	if (!accountData.value) return []
	
	const transactions = []
	
	// Add deposits
	accountData.value.deposits?.forEach(tx => {
		transactions.push({ ...tx, type: 'DEPOSIT', color: 'green' })
	})
	
	// Add withdraws
	accountData.value.withdraws?.forEach(tx => {
		transactions.push({ ...tx, type: 'WITHDRAW', color: 'red' })
	})
	
	// Add transfers
	accountData.value.transfers?.forEach(tx => {
		transactions.push({ ...tx, type: 'TRANSFER', color: 'blue' })
	})
	
	// Add borrows
	accountData.value.borrows?.forEach(tx => {
		transactions.push({ ...tx, type: 'BORROW', color: 'orange' })
	})
	
	// Add repays
	accountData.value.repays?.forEach(tx => {
		transactions.push({ ...tx, type: 'REPAY', color: 'purple' })
	})
	
	// Sort by timestamp
	return transactions.sort((a, b) => parseInt(b.blockTimestamp) - parseInt(a.blockTimestamp))
})

// Get unique vaults the account interacts with
const accountVaults = computed(() => {
	if (!accountData.value) return []
	
	const vaultSet = new Set()
	
	// Collect vault addresses from all events
	accountData.value.deposits?.forEach(tx => vaultSet.add(tx.vault))
	accountData.value.withdraws?.forEach(tx => vaultSet.add(tx.vault))
	accountData.value.transfers?.forEach(tx => vaultSet.add(tx.vault))
	accountData.value.borrows?.forEach(tx => vaultSet.add(tx.vault))
	accountData.value.repays?.forEach(tx => vaultSet.add(tx.vault))
	accountData.value.interestAccrueds?.forEach(tx => vaultSet.add(tx.vault))
	
	return Array.from(vaultSet).map(vaultId => {
		const balance = currentBalances.value.find(b => b.vault === vaultId)
		return {
			id: vaultId,
			balance: balance?.balance || '0',
			debt: balance?.debt || '0'
		}
	})
})

const loadAccountData = async () => {
	loading.value = true
	error.value = null
	accountData.value = null

	if (!accountId.value) {
		loading.value = false
		return
	}
	
	try {
		const data = await fetchAccountDetails(accountId.value)
		accountData.value = data
		
		// Check if we got any data at all
		const hasAnyData = Object.values(data).some(value => 
			Array.isArray(value) && value.length > 0
		)
		
		if (!hasAnyData) {
			error.value = 'No activity found for this account address'
		}
		
	} catch (err) {
		console.error('Failed to load account details:', err)
		error.value = err.message
	} finally {
		loading.value = false
	}
}

const searchAccount = () => {
	if (searchAccountId.value && searchAccountId.value !== accountId.value) {
		router.push({ name: 'account-detail', params: { accountId: searchAccountId.value } })
	}
}

const openInExplorer = () => {
	window.open(`${getExplorerURL(appStore.network)}/address/${accountId.value}`, '_blank', 'noopener noreferrer')
}

const goToSearch = () => {
	router.push({ name: 'account-search' })
}

const setActiveTab = (tabKey) => {
	activeTab.value = tabKey
}

onMounted(loadAccountData)
watch(() => accountId.value, (newVal) => {
	searchAccountId.value = newVal || ''
	loadAccountData()
})
watch(() => appStore.network, loadAccountData)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Header -->
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">ACCOUNT ANALYSIS</Text>
					<Text size="14" weight="600" color="secondary" mono>{{ accountId }}</Text>
				</Flex>
				
				<Flex align="center" gap="12">
					<!-- Search Bar -->
					<div :class="$style.searchBar">
						<input
							type="text"
							v-model="searchAccountId"
							@keyup.enter="searchAccount"
							placeholder="Enter account address"
							:class="$style.searchInput"
						/>
						<button @click="searchAccount" :class="$style.searchButton">
							<Icon name="coins" size="16" color="primary" />
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

			<!-- Loading State -->
			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">ANALYZING ACCOUNT...</Text>
			</div>

			<!-- Error State -->
			<div v-else-if="error" :class="$style.errorCard">
				<Icon name="zap" size="24" color="red" />
				<Text size="16" weight="600" color="red">FAILED TO LOAD ACCOUNT</Text>
				<Text size="14" weight="500" color="tertiary">{{ error }}</Text>
				<Flex gap="12">
					<button @click="loadAccountData" :class="$style.retryButton">
						<Text size="12" weight="700" color="secondary">RETRY</Text>
					</button>
					<button @click="goToSearch" :class="$style.retryButton">
						<Text size="12" weight="700" color="secondary">NEW SEARCH</Text>
					</button>
				</Flex>
			</div>

			<!-- Account Content -->
			<div v-else>
				<!-- Tab Navigation -->
				<div :class="$style.tabNavigation">
					<div
						v-for="tab in tabs"
						:key="tab.key"
						@click="setActiveTab(tab.key)"
						:class="[$style.tab, activeTab === tab.key && $style.activeTab]"
					>
						<Icon :name="tab.icon" size="16" color="secondary" />
						<Text size="12" weight="700" color="secondary">{{ tab.name }}</Text>
					</div>
				</div>

				<!-- Tab Content -->
				<div :class="$style.tabContent">
					<!-- Overview Tab -->
					<div v-if="activeTab === 'overview'">
						<!-- Account Overview -->
						<div :class="$style.overviewCard">
							<Text size="18" weight="700" color="primary">ACCOUNT OVERVIEW</Text>
							
							<div :class="$style.metricsGrid">
								<div :class="$style.balanceCard">
									<Text size="14" weight="600" color="green">TOTAL BALANCE</Text>
									<Text size="28" weight="700" color="green" mono>
										{{ formatAmount(totalBalance.toString()) }}
									</Text>
								</div>
								
								<div :class="$style.debtCard">
									<Text size="14" weight="600" color="red">TOTAL DEBT</Text>
									<Text size="28" weight="700" color="red" mono>
										{{ formatAmount(totalDebt.toString()) }}
									</Text>
								</div>
								
								<div :class="$style.vaultsCard">
									<Text size="14" weight="600" color="blue">ACTIVE VAULTS</Text>
									<Text size="28" weight="700" color="blue" mono>{{ accountVaults.length }}</Text>
								</div>
								
								<div :class="$style.activityCard">
									<Text size="14" weight="600" color="purple">TOTAL TRANSACTIONS</Text>
									<Text size="28" weight="700" color="purple" mono>{{ allTransactions.length }}</Text>
								</div>
							</div>
						</div>

						<!-- Charts Section -->
						<div :class="$style.chartsGrid">
							<CashFlowChart :accountData="accountData" />
							<LiquidationHistory :liquidations="accountData?.liquidates || []" />
						</div>

						<!-- Vaults List -->
						<AccountVaultsList :vaults="accountVaults" />
					</div>

					<!-- Transactions Tab -->
					<div v-if="activeTab === 'transactions'" :class="$style.transactionsTab">
						<Text size="18" weight="700" color="primary">ALL TRANSACTIONS</Text>
						
						<div :class="$style.transactionsList">
							<div :class="$style.transactionHeader">
								<Text size="12" weight="700" color="tertiary">TYPE</Text>
								<Text size="12" weight="700" color="tertiary">DETAILS</Text>
								<Text size="12" weight="700" color="tertiary">AMOUNT</Text>
								<Text size="12" weight="700" color="tertiary">TIME</Text>
							</div>
							
							<div
								v-for="tx in allTransactions.slice(0, 50)"
								:key="tx.id"
								:class="$style.transactionRow"
							>
								<div :class="$style.typeTag" :style="{ borderColor: `var(--${tx.color})` }">
									<Text size="11" weight="700" :color="tx.color">{{ tx.type }}</Text>
								</div>
								
								<router-link :to="`/dashboard/transaction/${tx.transactionHash}`" :class="$style.txLink">
									<Text size="12" weight="600" color="secondary" mono>
										{{ formatAddress(tx.transactionHash) }}
									</Text>
								</router-link>
								
								<Text size="12" weight="600" color="primary" mono>
									{{ formatAmount(tx.assets || tx.value || '0') }}
								</Text>
								
								<Text size="11" weight="500" color="tertiary">
									{{ DateTime.fromSeconds(parseInt(tx.blockTimestamp)).toRelative() }}
								</Text>
							</div>
						</div>
					</div>

					<!-- Debt Tab -->
					<div v-if="activeTab === 'debt'" :class="$style.debtTab">
						<Text size="18" weight="700" color="primary">DEBT ANALYSIS</Text>
						
						<div :class="$style.debtGrid">
							<!-- Borrow Events -->
							<div :class="$style.debtCard">
								<Text size="16" weight="700" color="orange">BORROW EVENTS</Text>
								<div :class="$style.eventsList">
									<div v-for="borrow in accountData?.borrows?.slice(0, 10)" :key="borrow.id" :class="$style.eventItem">
										<router-link :to="`/dashboard/transaction/${borrow.transactionHash}`" :class="$style.txLink">
											<Text size="12" weight="600" color="orange" mono>
												+{{ formatAmount(borrow.assets) }}
											</Text>
										</router-link>
										<Text size="11" weight="500" color="tertiary">
											{{ DateTime.fromSeconds(parseInt(borrow.blockTimestamp)).toRelative() }}
										</Text>
									</div>
								</div>
							</div>
							
							<!-- Repay Events -->
							<div :class="$style.debtCard">
								<Text size="16" weight="700" color="green">REPAY EVENTS</Text>
								<div :class="$style.eventsList">
									<div v-for="repay in accountData?.repays?.slice(0, 10)" :key="repay.id" :class="$style.eventItem">
										<router-link :to="`/dashboard/transaction/${repay.transactionHash}`" :class="$style.txLink">
											<Text size="12" weight="600" color="green" mono>
												-{{ formatAmount(repay.assets) }}
											</Text>
										</router-link>
										<Text size="11" weight="500" color="tertiary">
											{{ DateTime.fromSeconds(parseInt(repay.blockTimestamp)).toRelative() }}
										</Text>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Current Debt by Vault -->
						<div :class="$style.currentDebtCard">
							<Text size="16" weight="700" color="primary">CURRENT DEBT BY VAULT</Text>
							<div :class="$style.vaultDebtList">
								<div v-for="balance in currentBalances" :key="balance.vault" :class="$style.vaultDebtItem">
									<router-link :to="`/dashboard/vault/${balance.vault}`" :class="$style.vaultLink">
										<Text size="12" weight="600" color="secondary" mono>
											{{ formatAddress(balance.vault) }}
										</Text>
									</router-link>
									<Text size="12" weight="600" color="red" mono>
										{{ formatAmount(balance.debt) }}
									</Text>
								</div>
							</div>
						</div>
					</div>

					<!-- Liquidations Tab -->
					<div v-if="activeTab === 'liquidations'" :class="$style.liquidationsTab">
						<Text size="18" weight="700" color="primary">LIQUIDATION HISTORY</Text>
						
						<div v-if="!accountData?.liquidates?.length" :class="$style.noData">
							<Text size="14" weight="600" color="tertiary">NO LIQUIDATION EVENTS FOUND</Text>
						</div>
						
						<div v-else :class="$style.liquidationsList">
							<div v-for="liquidation in accountData.liquidates" :key="liquidation.id" :class="$style.liquidationItem">
								<Flex direction="column" gap="12">
									<Flex align="center" justify="between">
										<Text size="13" weight="700" :color="liquidation.violator === accountId ? 'red' : 'green'">
											{{ liquidation.violator === accountId ? 'LIQUIDATED' : 'LIQUIDATOR' }}
										</Text>
										<Text size="11" weight="500" color="tertiary">
											{{ DateTime.fromSeconds(parseInt(liquidation.blockTimestamp)).toRelative() }}
										</Text>
									</Flex>
									
									<div :class="$style.liquidationDetails">
										<div :class="$style.detailRow">
											<Text size="11" weight="600" color="tertiary">LIQUIDATOR</Text>
											<Text size="12" weight="600" color="green" mono>
												{{ formatAddress(liquidation.liquidator) }}
											</Text>
										</div>
										
										<div :class="$style.detailRow">
											<Text size="11" weight="600" color="tertiary">VIOLATOR</Text>
											<Text size="12" weight="600" color="red" mono>
												{{ formatAddress(liquidation.violator) }}
											</Text>
										</div>
										
										<div :class="$style.detailRow">
											<Text size="11" weight="600" color="tertiary">REPAY AMOUNT</Text>
											<router-link :to="`/dashboard/transaction/${liquidation.transactionHash}`" :class="$style.txLink">
												<Text size="12" weight="600" color="orange" mono>
													{{ formatAmount(liquidation.repayAssets) }}
												</Text>
											</router-link>
										</div>
									</div>
								</Flex>
							</div>
						</div>
					</div>

					<!-- Earn & Swap Tab -->
					<div v-if="activeTab === 'earn-swap'" :class="$style.earnSwapTab">
						<Text size="18" weight="700" color="primary">EARN & SWAP ACTIVITY</Text>
						
						<div :class="$style.earnSwapGrid">
							<!-- Earn Deposits -->
							<div :class="$style.earnCard">
								<Text size="16" weight="700" color="green">EARN DEPOSITS</Text>
								<div :class="$style.earnList">
									<div v-for="deposit in accountData?.eulerEarnDeposits?.slice(0, 8)" :key="deposit.id" :class="$style.earnItem">
										<router-link :to="`/dashboard/transaction/${deposit.transactionHash}`" :class="$style.txLink">
											<Text size="12" weight="600" color="green" mono>
												+{{ formatAmount(deposit.assets) }}
											</Text>
										</router-link>
										<Text size="11" weight="500" color="tertiary">
											{{ deposit.eulerEarnVault?.name || 'Unknown Vault' }}
										</Text>
									</div>
								</div>
							</div>
							
							<!-- Swaps -->
							<div :class="$style.swapCard">
								<Text size="16" weight="700" color="purple">SWAP ACTIVITY</Text>
								<div :class="$style.swapList">
									<div v-for="swap in accountData?.eulerSwaps?.slice(0, 8)" :key="swap.id" :class="$style.swapItem">
										<router-link :to="`/dashboard/transaction/${swap.transactionHash}`" :class="$style.txLink">
											<Text size="12" weight="600" color="purple" mono>
												{{ formatAmount(swap.amount0In || swap.amount1In) }} → {{ formatAmount(swap.amount0Out || swap.amount1Out) }}
											</Text>
										</router-link>
										<Text size="11" weight="500" color="tertiary">
											{{ DateTime.fromSeconds(parseInt(swap.blockTimestamp)).toRelative() }}
										</Text>
									</div>
								</div>
							</div>
						</div>
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

.retryButton {
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 4px;
	padding: 8px 16px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.retryButton:hover {
	background: rgba(255, 255, 255, 0.2);
}

.tabNavigation {
	display: flex;
	gap: 4px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 4px;
}

.tab {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
	flex: 1;
	justify-content: center;
}

.tab:hover {
	background: rgba(0, 255, 157, 0.05);
}

.activeTab {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.2) 0%, rgba(0, 255, 255, 0.1) 100%);
	border: 1px solid rgba(0, 255, 157, 0.3);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
}

.tabContent {
	min-height: 400px;
}

.overviewCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
	margin-bottom: 24px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
	margin-top: 16px;
}

.balanceCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.debtCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.vaultsCard {
	background: linear-gradient(135deg, rgba(0, 170, 255, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 170, 255, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.activityCard {
	background: linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 255, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.chartsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 20px;
	margin-bottom: 24px;
}

.transactionsTab, .debtTab, .liquidationsTab, .earnSwapTab {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.transactionsList {
	margin-top: 16px;
	max-height: 500px;
	overflow-y: auto;
}

.transactionHeader {
	display: grid;
	grid-template-columns: 100px 1fr 120px 100px;
	gap: 16px;
	padding: 12px 0;
	border-bottom: 1px solid rgba(0, 255, 255, 0.2);
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

.txLink {
	text-decoration: none;
	color: inherit;
}

.txLink:hover {
	opacity: 0.8;
}

.debtGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	margin-top: 16px;
}

.eventsList {
	margin-top: 12px;
	max-height: 200px;
	overflow-y: auto;
}

.eventItem {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.currentDebtCard {
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 8px;
	padding: 20px;
	margin-top: 20px;
}

.vaultDebtList {
	margin-top: 12px;
}

.vaultDebtItem {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.vaultLink {
	text-decoration: none;
	color: inherit;
}

.vaultLink:hover {
	opacity: 0.8;
}

.noData {
	text-align: center;
	padding: 40px;
}

.liquidationsList {
	margin-top: 16px;
	max-height: 500px;
	overflow-y: auto;
}

.liquidationItem {
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.1);
	border-radius: 6px;
	padding: 16px;
	margin-bottom: 12px;
}

.liquidationDetails {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;
}

.detailRow {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.earnSwapGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
	margin-top: 16px;
}

.earnCard, .swapCard {
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	padding: 16px;
}

.earnList, .swapList {
	margin-top: 12px;
	max-height: 200px;
	overflow-y: auto;
}

.earnItem, .swapItem {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
	.chartsGrid {
		grid-template-columns: 1fr;
	}
	
	.debtGrid, .earnSwapGrid {
		grid-template-columns: 1fr;
	}
	
	.transactionHeader, .transactionRow {
		grid-template-columns: 80px 1fr 100px 80px;
		gap: 8px;
	}
}
</style>