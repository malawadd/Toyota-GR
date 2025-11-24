<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const searchAccountId = ref('')
const recentSearches = ref([])

const searchAccount = () => {
	if (searchAccountId.value.trim()) {
		const accountId = searchAccountId.value.trim()
		
		// Add to recent searches
		if (!recentSearches.value.includes(accountId)) {
			recentSearches.value.unshift(accountId)
			if (recentSearches.value.length > 5) {
				recentSearches.value.pop()
			}
		}
		
		// Navigate to account detail
		router.push({ name: 'account-detail', params: { accountId } })
	}
}

const searchFromRecent = (accountId) => {
	searchAccountId.value = accountId
	searchAccount()
}

const formatAddress = (addr) => `${addr.slice(0, 12)}...${addr.slice(-8)}`
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Text size="24" weight="700" color="primary">ACCOUNT LOOKUP</Text>

			<!-- Search Section -->
			<div :class="$style.searchSection">
				<Text size="16" weight="700" color="primary">SEARCH ACCOUNT</Text>
				
				<div :class="$style.searchBar">
					<input
						type="text"
						v-model="searchAccountId"
						@keyup.enter="searchAccount"
						placeholder="Enter account address (0x...)"
						:class="$style.searchInput"
					/>
					<button @click="searchAccount" :class="$style.searchButton">
						<Icon name="coins" size="16" color="primary" />
						<Text size="12" weight="700" color="primary">ANALYZE</Text>
					</button>
				</div>
				
				<Text size="12" weight="500" color="tertiary">
					Enter an account address to view comprehensive analysis including cash flows, debt positions, liquidation history, and vault interactions.
				</Text>
			</div>

			<!-- Recent Searches -->
			<div v-if="recentSearches.length > 0" :class="$style.recentSection">
				<Text size="16" weight="700" color="primary">RECENT SEARCHES</Text>
				
				<div :class="$style.recentList">
					<div
						v-for="accountId in recentSearches"
						:key="accountId"
						@click="searchFromRecent(accountId)"
						:class="$style.recentItem"
					>
						<Icon name="coins" size="14" color="secondary" />
						<Text size="13" weight="600" color="secondary" mono>{{ formatAddress(accountId) }}</Text>
					</div>
				</div>
			</div>

			<!-- Features Overview -->
			<div :class="$style.featuresSection">
				<Text size="16" weight="700" color="primary">ANALYSIS FEATURES</Text>
				
				<div :class="$style.featuresGrid">
					<div :class="$style.featureCard">
						<Icon name="coins" size="24" color="green" />
						<Text size="14" weight="600" color="green">CASH FLOW TRACKING</Text>
						<Text size="12" weight="500" color="tertiary">
							Monitor deposits, withdrawals, and transfers with visual charts
						</Text>
					</div>
					
					<div :class="$style.featureCard">
						<Icon name="blob" size="24" color="orange" />
						<Text size="14" weight="600" color="orange">DEBT ANALYSIS</Text>
						<Text size="12" weight="500" color="tertiary">
							Track borrowing activity, repayments, and interest accrual
						</Text>
					</div>
					
					<div :class="$style.featureCard">
						<Icon name="zap" size="24" color="red" />
						<Text size="14" weight="600" color="red">LIQUIDATION HISTORY</Text>
						<Text size="12" weight="500" color="tertiary">
							View liquidation events as violator or liquidator
						</Text>
					</div>
					
					<div :class="$style.featureCard">
						<Icon name="check-circle" size="24" color="blue" />
						<Text size="14" weight="600" color="blue">VAULT DISCOVERY</Text>
						<Text size="12" weight="500" color="tertiary">
							Discover all vaults the account interacts with
						</Text>
					</div>
					
					<div :class="$style.featureCard">
						<Icon name="zap-circle" size="24" color="purple" />
						<Text size="14" weight="600" color="purple">EARN & SWAP</Text>
						<Text size="12" weight="500" color="tertiary">
							Track Euler Earn deposits and swap activities
						</Text>
					</div>
					
					<div :class="$style.featureCard">
						<Icon name="arrow-top-right" size="24" color="blue" />
						<Text size="14" weight="600" color="blue">REAL-TIME DATA</Text>
						<Text size="12" weight="500" color="tertiary">
							Current balance and debt positions across all vaults
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

.searchSection {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.searchBar {
	display: flex;
	align-items: center;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 4px;
	gap: 4px;
}

.searchInput {
	background: transparent;
	border: none;
	color: var(--txt-primary);
	padding: 12px 16px;
	font-size: 14px;
	flex-grow: 1;
	font-family: monospace;
}

.searchInput::placeholder {
	color: var(--txt-tertiary);
}

.searchButton {
	display: flex;
	align-items: center;
	gap: 8px;
	background: rgba(0, 255, 157, 0.2);
	border: 1px solid rgba(0, 255, 157, 0.4);
	border-radius: 6px;
	padding: 10px 16px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.searchButton:hover {
	background: rgba(0, 255, 157, 0.3);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.recentSection {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.recentList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.recentItem {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background: rgba(0, 255, 255, 0.05);
	border: 1px solid rgba(0, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.recentItem:hover {
	background: rgba(0, 255, 255, 0.1);
	border-color: rgba(0, 255, 255, 0.3);
}

.featuresSection {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 0, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.featuresGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
}

.featureCard {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 20px;
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	text-align: center;
}
</style>