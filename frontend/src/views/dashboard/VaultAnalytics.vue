<script setup>
import { ref, computed, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { useVaultsStore } from "@/stores/vaults"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const vaultsStore = useVaultsStore()
const router = useRouter()
const showAll = ref(false)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(2)
}

const navigateToVault = (vaultId) => {
	router.push(`/dashboard/vault/${vaultId}`)
}

const displayedVaults = computed(() => {
	return showAll.value ? vaultsStore.vaultsSortedByCash : vaultsStore.vaultsSortedByCash.slice(0, 9)
})

const loadData = async () => {
	await vaultsStore.loadAllVaultsData()
}

onMounted(loadData)
watch(() => appStore.network, () => {
	vaultsStore.clearCache()
	loadData()
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Text size="24" weight="700" color="primary">VAULT ANALYTICS SYSTEM</Text>
				<div v-if="vaultsStore.loading" :class="$style.loadingBadge">
					<Text size="11" weight="700" color="blue">LOADING...</Text>
				</div>
				<button v-else-if="!vaultsStore.isDataFresh()" @click="vaultsStore.refreshData()" :class="$style.refreshButton">
					<Text size="11" weight="700" color="green">REFRESH DATA</Text>
				</button>
			</Flex>

			<div :class="$style.grid">
				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">ACTIVE VAULTS</Text>
					<Text size="32" weight="700" color="primary" mono>{{ vaultsStore.activeVaultsCount }}</Text>
				</div>

				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">TOTAL CASH</Text>
					<Text size="32" weight="700" color="green" mono>
						{{ formatAmount(vaultsStore.totalCash.toString()) }}
					</Text>
				</div>

				<div :class="$style.card">
					<Text size="14" weight="600" color="tertiary">TOTAL BORROWS</Text>
					<Text size="32" weight="700" color="orange" mono>
						{{ formatAmount(vaultsStore.totalBorrows.toString()) }}
					</Text>
				</div>
			</div>

			<div :class="$style.vaultSection">
				<Flex align="center" justify="between">
					<Text size="16" weight="700" color="primary">VAULTS (ORDERED BY CASH)</Text>
					<button 
						v-if="vaultsStore.vaultsSortedByCash.length > 9" 
						@click="showAll = !showAll"
						:class="$style.toggleButton"
					>
						<Text size="12" weight="700" color="secondary">
							{{ showAll ? 'SHOW LESS' : `SHOW ALL (${vaultsStore.vaultsSortedByCash.length})` }}
						</Text>
					</button>
				</Flex>

				<div v-if="vaultsStore.loading" :class="$style.loadingGrid">
					<div v-for="i in 6" :key="i" :class="$style.loadingCard">
						<div :class="$style.loadingSkeleton" />
					</div>
				</div>

				<div v-else-if="vaultsStore.error" :class="$style.errorCard">
					<Text size="14" weight="600" color="red">ERROR: {{ vaultsStore.error }}</Text>
					<button @click="vaultsStore.refreshData()" :class="$style.retryButton">
						<Text size="12" weight="700" color="secondary">RETRY</Text>
					</button>
				</div>

				<div v-else :class="$style.vaultGrid">
					<div 
						v-for="vault in displayedVaults" 
						:key="vault.id" 
						:class="$style.vaultCard"
						@click="navigateToVault(vault.id)"
					>
						<Flex direction="column" gap="12">
							<Flex align="center" justify="between">
								<Flex direction="column" gap="4">
									<Text size="12" weight="700" color="primary">
										{{ vault.name || 'UNNAMED VAULT' }}
									</Text>
									<Text size="10" weight="500" color="tertiary" mono>
										{{ vault.id.slice(0, 12) }}...
									</Text>
								</Flex>
								<Icon name="arrow-top-right" size="12" color="secondary" />
							</Flex>
							
							<Flex justify="between">
								<Text size="11" weight="500" color="secondary">CASH</Text>
								<Text size="11" weight="600" color="green" mono>
									{{ formatAmount(vault.status?.cash || '0') }}
								</Text>
							</Flex>

							<Flex justify="between">
								<Text size="11" weight="500" color="secondary">BORROWS</Text>
								<Text size="11" weight="600" color="orange" mono>
									{{ formatAmount(vault.status?.totalBorrows || '0') }}
								</Text>
							</Flex>

							<Flex justify="between">
								<Text size="11" weight="500" color="secondary">INTEREST RATE</Text>
								<Text size="11" weight="600" color="blue" mono>
									{{ ((parseFloat(vault.status?.interestRate || '0') / 1e18) * 100).toFixed(2) }}%
								</Text>
							</Flex>

							<div :class="$style.utilizationBar">
								<div 
									:class="$style.utilizationFill"
									:style="{ 
										width: `${Math.min(100, (parseFloat(vault.status?.totalBorrows || '0') / Math.max(parseFloat(vault.status?.cash || '0'), 1)) * 100)}%` 
									}"
								/>
							</div>
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

.loadingBadge {
	padding: 4px 8px;
	background: rgba(0, 170, 255, 0.2);
	border: 1px solid rgba(0, 170, 255, 0.5);
	border-radius: 4px;
}

.refreshButton {
	padding: 4px 8px;
	background: rgba(0, 255, 157, 0.2);
	border: 1px solid rgba(0, 255, 157, 0.5);
	border-radius: 4px;
	transition: all 0.2s ease;
}

.refreshButton:hover {
	background: rgba(0, 255, 157, 0.3);
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.card {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.vaultSection {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.toggleButton {
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 4px;
	padding: 6px 12px;
	transition: all 0.2s ease;
}

.toggleButton:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

.loadingGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
	margin-top: 16px;
}

.loadingCard {
	height: 140px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	padding: 16px;
}

.loadingSkeleton {
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
	border-radius: 4px;
	animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
	0% { transform: translateX(-100%); }
	100% { transform: translateX(100%); }
}

.errorCard {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px;
	background: rgba(255, 0, 0, 0.1);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	margin-top: 16px;
}

.retryButton {
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 4px;
	padding: 6px 12px;
	transition: all 0.2s ease;
}

.retryButton:hover {
	background: rgba(255, 255, 255, 0.2);
}

.vaultGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
	margin-top: 16px;
}

.vaultCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 6px;
	padding: 16px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.vaultCard:hover {
	border-color: rgba(0, 255, 157, 0.4);
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
	transform: translateY(-2px);
}

.utilizationBar {
	height: 4px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 2px;
	overflow: hidden;
}

.utilizationFill {
	height: 100%;
	background: linear-gradient(90deg, #00ff9d, #ffaa00);
	transition: width 0.3s ease;
}
</style>