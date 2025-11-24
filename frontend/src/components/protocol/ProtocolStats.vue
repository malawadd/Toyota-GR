<script setup>
import { computed } from "vue"

const props = defineProps({
	protocolData: Object,
	feesData: Object
})

const formatAmount = (amount) => {
	if (amount > 1e9) return `$${(amount/1e9).toFixed(2)}B`
	if (amount > 1e6) return `$${(amount/1e6).toFixed(2)}M`
	if (amount > 1e3) return `$${(amount/1e3).toFixed(2)}K`
	return `$${amount.toFixed(2)}`
}

const protocolStats = computed(() => {
	if (!props.protocolData) return {}
	
	// Calculate total TVL across all chains
	const chainTvls = props.protocolData.chainTvls || {}
	let totalTvl = 0
	let totalChains = 0
	
	Object.keys(chainTvls).forEach(chainKey => {
		if (chainKey.includes('-borrowed')) return // Skip borrowed data
		
		const tvlData = chainTvls[chainKey]?.tvl || []
		if (tvlData.length > 0) {
			totalTvl += tvlData[tvlData.length - 1].totalLiquidityUSD
			totalChains++
		}
	})
	
	return {
		totalTvl,
		totalChains,
		supportedChains: props.protocolData.chains?.length || 0,
		category: props.protocolData.category || 'Unknown',
		audits: props.protocolData.audits || '0'
	}
})

const feesStats = computed(() => {
	if (!props.feesData) return {}
	
	return {
		total24h: props.feesData.total24h || 0,
		totalAllTime: props.feesData.totalAllTime || 0,
		avgDaily: props.feesData.total7d ? props.feesData.total7d / 7 : 0
	}
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" gap="16">
				<img 
					v-if="protocolData?.logo" 
					:src="protocolData.logo" 
					:alt="protocolData.name"
					:class="$style.logo"
				/>
				<Flex direction="column" gap="4">
					<Text size="20" weight="700" color="primary">{{ protocolData?.name || 'Euler V2' }}</Text>
					<Text size="12" weight="500" color="tertiary">{{ protocolData?.description || 'Lending Protocol' }}</Text>
				</Flex>
			</Flex>
			
			<div :class="$style.statsGrid">
				<div :class="$style.statCard">
					<Icon name="coins" size="20" color="green" />
					<Text size="12" weight="600" color="green">TOTAL TVL</Text>
					<Text size="18" weight="700" color="green" mono>
						{{ formatAmount(protocolStats.totalTvl) }}
					</Text>
				</div>
				
				<div :class="$style.statCard">
					<Icon name="zap-circle" size="20" color="orange" />
					<Text size="12" weight="600" color="orange">24H FEES</Text>
					<Text size="18" weight="700" color="orange" mono>
						{{ formatAmount(feesStats.total24h) }}
					</Text>
				</div>
				
				<div :class="$style.statCard">
					<Icon name="blob" size="20" color="blue" />
					<Text size="12" weight="600" color="blue">ACTIVE CHAINS</Text>
					<Text size="18" weight="700" color="blue" mono>{{ protocolStats.totalChains }}</Text>
				</div>
				
				<div :class="$style.statCard">
					<Icon name="check-circle" size="20" color="purple" />
					<Text size="12" weight="600" color="purple">CATEGORY</Text>
					<Text size="18" weight="700" color="purple">{{ protocolStats.category }}</Text>
				</div>
			</div>
			
			<div :class="$style.additionalStats">
				<div :class="$style.additionalStat">
					<Text size="12" weight="600" color="tertiary">SUPPORTED CHAINS</Text>
					<Text size="16" weight="700" color="secondary" mono>{{ protocolStats.supportedChains }}</Text>
				</div>
				
				<div :class="$style.additionalStat">
					<Text size="12" weight="600" color="tertiary">SECURITY AUDITS</Text>
					<Text size="16" weight="700" color="secondary" mono>{{ protocolStats.audits }}</Text>
				</div>
				
				<div :class="$style.additionalStat">
					<Text size="12" weight="600" color="tertiary">AVG DAILY FEES</Text>
					<Text size="16" weight="700" color="secondary" mono>{{ formatAmount(feesStats.avgDaily) }}</Text>
				</div>
				
				<div :class="$style.additionalStat">
					<Text size="12" weight="600" color="tertiary">ALL TIME FEES</Text>
					<Text size="16" weight="700" color="secondary" mono>{{ formatAmount(feesStats.totalAllTime) }}</Text>
				</div>
			</div>
			
			<div v-if="protocolData?.audit_links?.length" :class="$style.auditLinks">
				<Text size="14" weight="600" color="primary">SECURITY AUDITS</Text>
				<div :class="$style.linksList">
					<a 
						v-for="(link, index) in protocolData.audit_links" 
						:key="index"
						:href="link" 
						target="_blank" 
						rel="noopener noreferrer"
						:class="$style.auditLink"
					>
						<Icon name="arrow-top-right" size="12" color="secondary" />
						<Text size="12" weight="600" color="secondary">Audit Report {{ index + 1 }}</Text>
					</a>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.logo {
	width: 48px;
	height: 48px;
	border-radius: 8px;
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
}

.statCard {
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	text-align: center;
}

.additionalStats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 16px;
	padding: 16px;
	background: rgba(255, 255, 255, 0.02);
	border-radius: 6px;
}

.additionalStat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	text-align: center;
}

.auditLinks {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.linksList {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.auditLink {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	background: rgba(0, 255, 255, 0.1);
	border: 1px solid rgba(0, 255, 255, 0.3);
	border-radius: 4px;
	text-decoration: none;
	transition: all 0.2s ease;
}

.auditLink:hover {
	background: rgba(0, 255, 255, 0.2);
	box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}
</style>