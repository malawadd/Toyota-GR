<script setup>
/** Vendor */
import { ref, onMounted, watch } from "vue"

/** API */
import { fetchLatestTransactions } from "@/services/api/euler"

/** Store */
import { useAppStore } from "@/stores/app"
const appStore = useAppStore()

const tpm = ref({ current: 0, high: 0 })

const calculateTPM = async () => {
	try {
		const data = await fetchLatestTransactions(100)
		const allTxs = [
			...data.deposits,
			...data.borrows,
			...data.withdraws
		]
		
		// Calculate transactions in last minute
		const oneMinuteAgo = Math.floor(Date.now() / 1000) - 60
		const recentTxs = allTxs.filter(tx => parseInt(tx.blockTimestamp) > oneMinuteAgo)
		
		tpm.value = {
			current: recentTxs.length / 60, // per second
			high: Math.max(tpm.value.high, recentTxs.length / 60)
		}
	} catch (error) {
		console.error('Failed to calculate TPM:', error)
	}
}

onMounted(async () => {
	await calculateTPM()
	setInterval(calculateTPM, 30_000) // Update every 30 seconds
})

watch(() => appStore.network, calculateTPM)
</script>

<template>
	<Flex direction="column" gap="12">
		<Flex align="center" gap="6">
			<Flex align="center" gap="6">
				<div
					v-for="(bar, idx) in 20"
					:class="[$style.bar, tpm && (tpm.current * 60 * 100) / (tpm.high * 60) > idx * 5 && $style.active]"
				/>
			</Flex>

			<Flex align="center" :class="$style.current">
				<Text size="14" weight="600" color="primary" mono>
					{{ tpm ? (tpm.current * 60).toFixed(0) : 0 }}
				</Text>
			</Flex>
		</Flex>

		<Text size="12" weight="600" color="tertiary">Transactions per minute</Text>
	</Flex>
</template>

<style module>
.bar {
	width: 4px;
	height: 20px;

	border-radius: 50px;
	background: var(--op-10);

	&.active {
		background: var(--txt-secondary);
		box-shadow: 0 0 10px rgba(255, 255, 255, 50%);
	}
}

.current {
	height: 20px;

	border-radius: 5px;
	background: var(--op-10);

	padding: 0 6px;
}
</style>