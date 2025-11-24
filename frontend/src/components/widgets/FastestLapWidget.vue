<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useRacingStore } from "@/stores/racing"
import { formatLapTime, formatCarNumber } from "@/services/formatters"

const racingStore = useRacingStore()
const router = useRouter()

const topLaps = computed(() => {
	return racingStore.fastestLaps.slice(0, 3)
})

const goToVehicle = (vehicleId) => {
	router.push({ name: 'dashboard' }).then(() => {
		router.push({ name: 'vehicle-detail', params: { vehicleId } })
	})
}
</script>

<template>
	<Flex direction="column" gap="16" :class="$style.wrapper">
		<Flex align="center" justify="between">
			<Text size="16" weight="700" color="primary">FASTEST LAPS</Text>
			<Icon name="zap-circle" size="20" color="green" />
		</Flex>

		<Flex direction="column" gap="8">
			<Flex
				v-for="(lap, index) in topLaps"
				:key="lap.id"
				align="center"
				gap="12"
				:class="$style.lapCard"
				@click="goToVehicle(lap.vehicle_id)"
			>
				<div :class="[$style.position, index === 0 && $style.first]">
					<Text size="16" weight="700" :color="index === 0 ? 'green' : 'secondary'">
						{{ index + 1 }}
					</Text>
				</div>
				<Flex direction="column" gap="4" wide>
					<Flex align="center" gap="8">
						<Text size="14" weight="600" color="primary">{{ formatCarNumber(lap.vehicle_id?.split('-')[2]) }}</Text>
						<Text size="12" weight="500" color="tertiary">{{ lap.vehicle_id }}</Text>
					</Flex>
					<Text size="12" weight="600" color="secondary" mono>
						{{ formatLapTime(lap.lap_time) }}
					</Text>
				</Flex>
				<Icon name="arrow-top-right" size="16" color="blue" />
			</Flex>
		</Flex>

		<Text size="11" weight="500" color="support" align="center">
			Click to view vehicle details
		</Text>
	</Flex>
</template>

<style module>
.wrapper {
	background: var(--card-background);
	padding: 20px;
	border-radius: 12px;
	border: 2px solid var(--card-border);
	min-width: 300px;
}

.lapCard {
	background: rgba(0, 0, 0, 0.4);
	padding: 12px;
	border-radius: 8px;
	border: 1px solid var(--op-10);
	cursor: pointer;
	transition: all 0.3s ease;
}

.lapCard:hover {
	background: rgba(0, 255, 157, 0.1);
	border-color: var(--neon-lime);
	transform: translateX(4px);
}

.position {
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	border: 1px solid var(--op-10);
}

.position.first {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}
</style>
