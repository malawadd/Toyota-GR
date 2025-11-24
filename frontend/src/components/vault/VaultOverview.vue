<script setup>
import { ref, onMounted, watch, computed } from "vue"
import { fetchVaultDetails, fetchVaultLatestTransaction, fetchVaultStatusByTxHash } from "@/services/api/vault"
import { useAppStore } from "@/stores/app"

const props = defineProps({
	vaultId: String
})

const appStore = useAppStore()
const vaultInfo = ref(null)
const vaultStatus = ref(null)
const loading = ref(true)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const loadVaultData = async () => {
	loading.value = true
	try {
		// Get vault details
		const detailsData = await fetchVaultDetails(props.vaultId)
		vaultInfo.value = detailsData.eulerVaults?.[0] || null
		
		if (vaultInfo.value) {
			// Get latest transaction hash from transfers
			const transfersData = await fetchVaultLatestTransaction(props.vaultId)
			const latestTransfer = transfersData.transfers?.[0]
			
			if (latestTransfer) {
				// Get vault status using the transaction hash
				const statusData = await fetchVaultStatusByTxHash(latestTransfer.transactionHash)
				vaultStatus.value = statusData.vaultStatuses?.[0] || null
			}
		}
	} catch (error) {
		console.error('Failed to load vault overview:', error)
	} finally {
		loading.value = false
	}
}

onMounted(loadVaultData)
watch(() => appStore.network, loadVaultData)
watch(() => props.vaultId, loadVaultData)

const utilizationRate = computed(() => {
	if (!vaultStatus.value) return 0
	const cash = parseFloat(vaultStatus.value.cash || '0')
	const borrows = parseFloat(vaultStatus.value.totalBorrows || '0')
	if (cash === 0) return 0
	return ((borrows / cash) * 100).toFixed(2)
})
</script>

<template>
	<div :class="$style.container">
		<div v-if="loading" :class="$style.loading">
			<Text size="16" weight="600" color="tertiary">LOADING VAULT DATA...</Text>
		</div>

		<div v-else :class="$style.content">
			<!-- Vault Info Card -->
			<div :class="$style.infoCard">
				<Text size="18" weight="700" color="primary">VAULT INFORMATION</Text>
				<div :class="$style.infoGrid">
					<div :class="$style.infoItem">
						<Text size="12" weight="600" color="tertiary">NAME</Text>
						<Text size="14" weight="700" color="primary">{{ vaultInfo?.name || 'Unknown' }}</Text>
					</div>
					<div :class="$style.infoItem">
						<Text size="12" weight="600" color="tertiary">SYMBOL</Text>
						<Text size="14" weight="700" color="primary">{{ vaultInfo?.symbol || 'N/A' }}</Text>
					</div>
					<div :class="$style.infoItem">
						<Text size="12" weight="600" color="tertiary">CREATOR</Text>
						<Text size="14" weight="700" color="secondary" mono>
							{{ vaultInfo?.creator?.slice(0, 10) }}...
						</Text>
					</div>
					<div :class="$style.infoItem">
						<Text size="12" weight="600" color="tertiary">ASSET</Text>
						<Text size="14" weight="700" color="secondary" mono>
							{{ vaultInfo?.asset?.slice(0, 10) }}...
						</Text>
					</div>
				</div>
			</div>

			<!-- Status Metrics -->
			<div :class="$style.metricsGrid">
				<div :class="$style.metricCard">
					<Text size="14" weight="600" color="green">TOTAL CASH</Text>
					<Text size="24" weight="700" color="green" mono>
						{{ formatAmount(vaultStatus?.cash || '0') }}
					</Text>
				</div>

				<div :class="$style.metricCard">
					<Text size="14" weight="600" color="orange">TOTAL BORROWS</Text>
					<Text size="24" weight="700" color="orange" mono>
						{{ formatAmount(vaultStatus?.totalBorrows || '0') }}
					</Text>
				</div>

				<div :class="$style.metricCard">
					<Text size="14" weight="600" color="purple">TOTAL SHARES</Text>
					<Text size="24" weight="700" color="purple" mono>
						{{ formatAmount(vaultStatus?.totalShares || '0') }}
					</Text>
				</div>

				<div :class="$style.metricCard">
					<Text size="14" weight="600" color="blue">INTEREST RATE</Text>
					<Text size="24" weight="700" color="blue" mono>
						{{ ((parseFloat(vaultStatus?.interestRate || '0') / 1e18) * 100).toFixed(2) }}%
					</Text>
				</div>
			</div>

			<!-- Utilization Card -->
			<div :class="$style.utilizationCard">
				<Text size="16" weight="700" color="primary">UTILIZATION RATE</Text>
				<div :class="$style.utilizationMeter">
					<div :class="$style.meterTrack">
						<div 
							:class="$style.meterFill"
							:style="{ 
								width: `${Math.min(100, utilizationRate)}%`,
								background: utilizationRate > 90 ? '#ff0000' : utilizationRate > 70 ? '#ff6600' : '#00ff9d'
							}"
						/>
					</div>
					<Text size="20" weight="700" color="primary" mono>{{ utilizationRate }}%</Text>
				</div>
			</div>

			<!-- Caps Information -->
			<div :class="$style.capsCard">
				<Text size="16" weight="700" color="primary">VAULT LIMITS</Text>
				<div :class="$style.capsGrid">
					<div :class="$style.capItem">
						<Text size="12" weight="600" color="tertiary">BORROW CAP</Text>
						<Text size="16" weight="700" color="red" mono>
							{{ formatAmount(vaultInfo?.borrowCap || '0') }}
						</Text>
					</div>
					<div :class="$style.capItem">
						<Text size="12" weight="600" color="tertiary">SUPPLY CAP</Text>
						<Text size="16" weight="700" color="green" mono>
							{{ formatAmount(vaultInfo?.supplyCap || '0') }}
						</Text>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style module>
.container {
	max-width: 1200px;
}

.loading {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 200px;
}

.content {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.infoCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.infoGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
	margin-top: 16px;
}

.infoItem {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.metricCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.utilizationCard {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
	text-align: center;
}

.utilizationMeter {
	margin: 16px 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
	align-items: center;
}

.meterTrack {
	width: 100%;
	max-width: 300px;
	height: 12px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	overflow: hidden;
}

.meterFill {
	height: 100%;
	border-radius: 6px;
	transition: all 0.3s ease;
}

.capsCard {
	background: linear-gradient(135deg, rgba(255, 0, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.capsGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 24px;
	margin-top: 16px;
}

.capItem {
	text-align: center;
}
</style>