<script setup>
import { ref, onMounted, watch,computed } from "vue"
import { fetchVaultLiquidations } from "@/services/api/vault"
import { useAppStore } from "@/stores/app"
import { DateTime } from "luxon"

const props = defineProps({
	vaultId: String
})

const appStore = useAppStore()
const liquidations = ref([])

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatTime = (timestamp) => {
	return DateTime.fromSeconds(parseInt(timestamp)).toRelative()
}

const loadLiquidations = async () => {
	try {
		const data = await fetchVaultLiquidations(props.vaultId, 30)
		liquidations.value = data.liquidates || []
	} catch (error) {
		console.error('Failed to load vault liquidations:', error)
	}
}

onMounted(loadLiquidations)
watch(() => appStore.network, loadLiquidations)
watch(() => props.vaultId, loadLiquidations)

const totalLiquidated = computed(() => {
	return liquidations.value.reduce((acc, liq) => acc + parseFloat(liq.repayAssets), 0)
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<!-- Liquidation Stats -->
			<div :class="$style.statsGrid">
				<div :class="$style.alertCard">
					<Text size="14" weight="600" color="red">LIQUIDATION EVENTS</Text>
					<Text size="28" weight="700" color="red" mono>{{ liquidations.length }}</Text>
				</div>

				<div :class="$style.valueCard">
					<Text size="14" weight="600" color="orange">TOTAL LIQUIDATED</Text>
					<Text size="28" weight="700" color="orange" mono>
						{{ formatAmount(totalLiquidated.toString()) }}
					</Text>
				</div>

				<div :class="$style.riskCard">
					<Text size="14" weight="600" color="purple">RISK LEVEL</Text>
					<Text size="28" weight="700" color="purple" mono>
						{{ liquidations.length > 10 ? 'HIGH' : liquidations.length > 5 ? 'MED' : 'LOW' }}
					</Text>
				</div>
			</div>

			<!-- Liquidation Events -->
			<div :class="$style.liquidationList">
				<Text size="16" weight="700" color="primary">LIQUIDATION EVENTS</Text>
				
				<div v-if="liquidations.length === 0" :class="$style.noData">
					<Text size="14" weight="600" color="tertiary">NO LIQUIDATIONS FOUND</Text>
				</div>

				<div v-else :class="$style.events">
					<div
						v-for="liquidation in liquidations"
						:key="liquidation.id"
						:class="$style.liquidationEvent"
					>
						<Flex direction="column" gap="12">
							<Flex align="center" justify="between">
								<Text size="13" weight="700" color="red">LIQUIDATION EVENT</Text>
								<Text size="11" weight="500" color="tertiary">
									{{ formatTime(liquidation.blockTimestamp) }}
								</Text>
							</Flex>

							<div :class="$style.eventDetails">
								<div :class="$style.detailRow">
									<Text size="11" weight="600" color="tertiary">LIQUIDATOR</Text>
									<Text size="12" weight="600" color="green" mono>
										{{ liquidation.liquidator.slice(0, 12) }}...
									</Text>
								</div>

								<div :class="$style.detailRow">
									<Text size="11" weight="600" color="tertiary">VIOLATOR</Text>
									<Text size="12" weight="600" color="red" mono>
										{{ liquidation.violator.slice(0, 12) }}...
									</Text>
								</div>

								<div :class="$style.detailRow">
									<Text size="11" weight="600" color="tertiary">REPAY AMOUNT</Text>
									<Text size="12" weight="600" color="orange" mono>
										{{ formatAmount(liquidation.repayAssets) }}
									</Text>
								</div>

								<div :class="$style.detailRow">
									<Text size="11" weight="600" color="tertiary">YIELD BALANCE</Text>
									<Text size="12" weight="600" color="blue" mono>
										{{ formatAmount(liquidation.yieldBalance) }}
									</Text>
								</div>
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
	max-width: 1200px;
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.alertCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.valueCard {
	background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.riskCard {
	background: linear-gradient(135deg, rgba(255, 0, 255, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 255, 0.3);
	border-radius: 8px;
	padding: 20px;
	text-align: center;
}

.liquidationList {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.noData {
	text-align: center;
	padding: 40px;
}

.events {
	margin-top: 16px;
	max-height: 500px;
	overflow-y: auto;
}

.liquidationEvent {
	background: rgba(255, 0, 0, 0.05);
	border: 1px solid rgba(255, 0, 0, 0.2);
	border-radius: 8px;
	padding: 16px;
	margin-bottom: 12px;
	transition: all 0.2s ease;
}

.liquidationEvent:hover {
	background: rgba(255, 0, 0, 0.1);
	border-color: rgba(255, 0, 0, 0.4);
}

.eventDetails {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px;
}

.detailRow {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>