<script setup>
import { ref, onMounted } from "vue"
import { useRacingStore } from "@/stores/racing"
import { formatLapTime } from "@/services/formatters"

const racingStore = useRacingStore()
const loading = ref(true)

onMounted(async () => {
	await racingStore.loadInitialData()
	loading.value = false
})
</script>

<template>
	<Flex :class="$style.wrapper">
		<Flex direction="column" gap="4" wide :class="$style.table">
			<Flex direction="column" justify="between" :class="$style.items">
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Total Vehicles</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono>
						{{ racingStore.statistics?.totalVehicles || '--' }}
					</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Total Laps</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono>
						{{ racingStore.statistics?.totalLaps || '--' }}
					</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Fastest Lap</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono no-wrap>
						{{ racingStore.statistics?.fastestLap ? formatLapTime(racingStore.statistics.fastestLap) : '--:--.---' }}
					</Text>
				</Flex>
				<Flex align="center" gap="12">
					<Text size="14" weight="500" color="tertiary" no-wrap>Max Speed</Text>
					<div :class="$style.dots" />
					<Text size="14" weight="600" color="primary" mono no-wrap>
						{{ racingStore.statistics?.maxSpeed ? `${racingStore.statistics.maxSpeed.toFixed(1)} km/h` : '--' }}
					</Text>
				</Flex>
			</Flex>

			<Flex align="center" justify="between" :class="$style.bottom">
				<Text size="13" weight="500" color="tertiary">
					Toyota GR Cup Series
				</Text>
				<Text size="13" weight="500" color="support">Live Dashboard</Text>
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
