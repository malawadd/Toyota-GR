<script setup>
import { ref, watch, onMounted } from "vue"
import { DateTime } from "luxon"
import { fetchWhaleBalances, fetchNewVaults } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()
const whales = ref([])
const newVaults = ref([])
const totalWhaleBalance = ref(0)
const when = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(1)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(1)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(1)}K`
	return num.toFixed(2)
}

const formatAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

const getData = async () => {
	try {
		const minBalance = (1e6 * 1e18).toString() // 1M minimum
		const whaleData = await fetchWhaleBalances("1000000000000000000000000")
		whales.value = whaleData.trackingVaultBalances || []
		totalWhaleBalance.value = whales.value.reduce((acc, whale) => acc + parseFloat(whale.balance), 0)

		const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
		const vaultData = await fetchNewVaults(weekAgo.toString())
		newVaults.value = vaultData.proxyCreateds || []
		
		when.value = new Date().getTime()
	} catch (error) {
		console.error('Failed to load stats:', error)
	}
}

onMounted(getData)
watch(() => appStore.network, getData)
</script>

<template>
	<Flex :class="$style.wrapper">
		<Flex direction="column" gap="4" wide :class="$style.table">
			<Flex direction="column" justify="between" :class="$style.items">
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Whale Accounts</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono>{{ whales.length }}</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Whale Balance</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono no-wrap>{{ formatAmount(totalWhaleBalance.toString()) }}</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>New Vaults (7d)</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono no-wrap>{{ newVaults.length }}</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Network</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono no-wrap style="text-transform: capitalize">
						{{ appStore.network }}
					</Text>
				</Flex>
			</Flex>

			<Flex align="center" justify="between" :class="$style.bottom">
				<Text size="13" weight="500" color="tertiary">
					Euler Finance by <a href="https://euler.finance" target="_blank">Euler</a>
				</Text>
				<Text size="13" weight="500" color="support">Updated {{ DateTime.fromMillis(when).toFormat("T") }}</Text>
			</Flex>
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	min-height: 220px;
	background: var(--card-background);
	padding: 20px;
}

.table {
	overflow: hidden;
	border-radius: 12px;
	border: 2px solid var(--op-10);
	background: rgba(0, 0, 0, 20%);
}

.items {
	height: 100%;
	padding: 16px;
}

.dots {
	width: 100%;
	height: 3px;
	background-image: linear-gradient(to right, var(--op-10) 33%, rgba(255, 255, 255, 0) 0%);
	background-position: bottom;
	background-size: 6px 3px;
	background-repeat: repeat-x;
}

.bottom {
	background: var(--op-5);
	padding: 12px 16px;
}
</style>