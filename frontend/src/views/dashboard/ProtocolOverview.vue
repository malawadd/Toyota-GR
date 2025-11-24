<script setup>
import { ref, onMounted, watch } from "vue"
import { fetchProtocolData, fetchFeesData, clearDefiLlamaCache } from "@/services/api/defillama"
import { useAppStore } from "@/stores/app"

// Components
import TVLChart from "@/components/protocol/TVLChart.vue"
import FeesChart from "@/components/protocol/FeesChart.vue"
import ProtocolStats from "@/components/protocol/ProtocolStats.vue"

const appStore = useAppStore()
const protocolData = ref(null)
const feesData = ref(null)
const loading = ref(true)
const error = ref(null)

const loadProtocolData = async () => {
	loading.value = true
	error.value = null
	
	try {
		const [protocol, fees] = await Promise.all([
			fetchProtocolData(),
			fetchFeesData()
		])
		
		protocolData.value = protocol
		feesData.value = fees
		
		console.log('Protocol data loaded:', protocol)
		console.log('Fees data loaded:', fees)
		
	} catch (err) {
		console.error('Failed to load protocol data:', err)
		error.value = err.message
	} finally {
		loading.value = false
	}
}

const refreshData = () => {
	clearDefiLlamaCache()
	loadProtocolData()
}

onMounted(loadProtocolData)

// Watch for network changes to update charts
watch(() => appStore.network, () => {
	// Charts will automatically update based on the new network
	// No need to refetch data since it's cached
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Header -->
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">PROTOCOL OVERVIEW</Text>
					<Text size="14" weight="600" color="secondary">
						Comprehensive analytics powered by DeFiLlama
					</Text>
				</Flex>
				
				<Flex align="center" gap="12">
					<div v-if="loading" :class="$style.loadingBadge">
						<Text size="11" weight="700" color="blue">LOADING...</Text>
					</div>
					
					<button v-else @click="refreshData" :class="$style.refreshButton">
						<Icon name="zap-circle" size="16" color="green" />
						<Text size="12" weight="700" color="green">REFRESH</Text>
					</button>
				</Flex>
			</Flex>

			<!-- Loading State -->
			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING PROTOCOL DATA...</Text>
				<Text size="12" weight="500" color="support">Fetching data from DeFiLlama API</Text>
			</div>

			<!-- Error State -->
			<div v-else-if="error" :class="$style.errorCard">
				<Icon name="zap" size="24" color="red" />
				<Text size="16" weight="600" color="red">FAILED TO LOAD DATA</Text>
				<Text size="14" weight="500" color="tertiary">{{ error }}</Text>
				<button @click="refreshData" :class="$style.retryButton">
					<Text size="12" weight="700" color="secondary">RETRY</Text>
				</button>
			</div>

			<!-- Protocol Content -->
			<div v-else>
				<!-- Protocol Stats -->
				<ProtocolStats :protocolData="protocolData" :feesData="feesData" />
				
				<!-- Charts Grid -->
				<div :class="$style.chartsGrid">
					<TVLChart :protocolData="protocolData" />
					<FeesChart :feesData="feesData" />
				</div>
				
				<!-- Additional Info -->
				<div :class="$style.infoCard">
					<Text size="16" weight="700" color="primary">ABOUT EULER V2</Text>
					<Text size="14" weight="500" color="secondary" height="150">
						{{ protocolData?.description || 'Euler V2 is a next-generation lending protocol that enables users to lend and borrow crypto assets with enhanced capital efficiency and risk management features.' }}
					</Text>
					
					<Flex align="center" gap="16" style="margin-top: 16px;">
						<a 
							v-if="protocolData?.url" 
							:href="protocolData.url" 
							target="_blank" 
							rel="noopener noreferrer"
							:class="$style.externalLink"
						>
							<Icon name="arrow-top-right" size="14" color="blue" />
							<Text size="12" weight="700" color="blue">WEBSITE</Text>
						</a>
						
						<a 
							v-if="protocolData?.twitter" 
							:href="`https://twitter.com/${protocolData.twitter}`" 
							target="_blank" 
							rel="noopener noreferrer"
							:class="$style.externalLink"
						>
							<Icon name="arrow-top-right" size="14" color="blue" />
							<Text size="12" weight="700" color="blue">TWITTER</Text>
						</a>
					</Flex>
				</div>
				
				<!-- Data Source -->
				<div :class="$style.sourceCard">
					<Text size="12" weight="600" color="tertiary">DATA SOURCE</Text>
					<Text size="11" weight="500" color="support">
						All TVL and fees data is sourced from DeFiLlama API. Data is cached for 10 minutes to optimize performance.
					</Text>
					<Text size="11" weight="500" color="support">
						Last updated: {{ new Date().toLocaleString() }}
					</Text>
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
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 6px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.refreshButton:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
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

.chartsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
	gap: 24px;
}

.infoCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 24px;
}

.externalLink {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	background: rgba(0, 170, 255, 0.1);
	border: 1px solid rgba(0, 170, 255, 0.3);
	border-radius: 4px;
	text-decoration: none;
	transition: all 0.2s ease;
}

.externalLink:hover {
	background: rgba(0, 170, 255, 0.2);
	box-shadow: 0 0 10px rgba(0, 170, 255, 0.3);
}

.sourceCard {
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	padding: 16px;
	text-align: center;
}

@media (max-width: 1024px) {
	.chartsGrid {
		grid-template-columns: 1fr;
	}
}
</style>