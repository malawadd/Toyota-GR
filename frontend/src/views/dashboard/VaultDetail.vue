<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { useRoute } from "vue-router"
import { useAppStore } from "@/stores/app"

// Import vault detail components
import VaultOverview from "@/components/vault/VaultOverview.vue"
import VaultTransactions from "@/components/vault/VaultTransactions.vue"
import VaultLiquidations from "@/components/vault/VaultLiquidations.vue"
import VaultInterestMetrics from "@/components/vault/VaultInterestMetrics.vue"
import VaultUtilization from "@/components/vault/VaultUtilization.vue"

const route = useRoute()
const appStore = useAppStore()

const vaultId = computed(() => route.params.vaultId)
const activeTab = ref('overview')

const tabs = [
	{ key: 'overview', name: 'OVERVIEW', icon: 'blob' },
	{ key: 'transactions', name: 'TRANSACTIONS', icon: 'arrow-top-right' },
	{ key: 'liquidations', name: 'LIQUIDATIONS', icon: 'zap' },
	{ key: 'interest', name: 'INTEREST', icon: 'coins' },
	{ key: 'utilization', name: 'UTILIZATION', icon: 'check-circle' }
]

const setActiveTab = (tabKey) => {
	activeTab.value = tabKey
}

// Watch for network changes to refresh data
watch(() => appStore.network, () => {
	// Components will handle their own data refresh
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Header -->
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">VAULT ANALYSIS</Text>
					<Text size="14" weight="600" color="secondary" mono>{{ vaultId }}</Text>
				</Flex>
				
				<router-link to="/dashboard/vault-analytics" :class="$style.backLink">
					<Icon name="arrow-top-right" size="16" color="secondary" :rotate="180" />
					<Text size="12" weight="700" color="secondary">BACK TO ANALYTICS</Text>
				</router-link>
			</Flex>

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
				<VaultOverview v-if="activeTab === 'overview'" :vaultId="vaultId" />
				<VaultTransactions v-if="activeTab === 'transactions'" :vaultId="vaultId" />
				<VaultLiquidations v-if="activeTab === 'liquidations'" :vaultId="vaultId" />
				<VaultInterestMetrics v-if="activeTab === 'interest'" :vaultId="vaultId" />
				<VaultUtilization v-if="activeTab === 'utilization'" :vaultId="vaultId" />
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
}

.backLink {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: rgba(255, 0, 255, 0.1);
	border: 1px solid rgba(255, 0, 255, 0.3);
	border-radius: 6px;
	transition: all 0.2s ease;
	text-decoration: none;
}

.backLink:hover {
	background: rgba(255, 0, 255, 0.2);
	box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
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
</style>