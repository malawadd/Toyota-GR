<script setup>
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useRacingStore } from "@/stores/racing"
import { formatCarNumber, getClassColor } from "@/services/formatters"

const racingStore = useRacingStore()
const router = useRouter()

const vehiclesByClass = computed(() => racingStore.vehiclesByClass)
const totalVehicles = computed(() => racingStore.totalVehicles)

const topVehicles = computed(() => {
	return racingStore.vehicles
		.slice()
		.sort((a, b) => (a.statistics?.position || 999) - (b.statistics?.position || 999))
		.slice(0, 8)
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
			<Text size="16" weight="700" color="primary">ACTIVE VEHICLES</Text>
			<Text size="14" weight="600" color="secondary" mono>{{ totalVehicles }}</Text>
		</Flex>

		<Flex direction="column" gap="8" :class="$style.vehicleList">
			<Flex
				v-for="vehicle in topVehicles"
				:key="vehicle.vehicleId"
				align="center"
				gap="12"
				:class="$style.vehicleCard"
				@click="goToVehicle(vehicle.vehicleId)"
			>
				<div :class="$style.position">
					<Text size="14" weight="700" color="secondary">
						{{ vehicle.statistics?.position || '--' }}
					</Text>
				</div>
				<Flex direction="column" gap="2" wide>
					<Flex align="center" gap="8">
						<Text size="14" weight="600" color="primary">
							{{ formatCarNumber(vehicle.carNumber) }}
						</Text>
						<div :class="$style.classBadge" :style="{ borderColor: getClassColor(vehicle.class) }">
							<Text size="10" weight="700" :style="{ color: getClassColor(vehicle.class) }">
								{{ vehicle.class }}
							</Text>
						</div>
					</Flex>
					<Text size="11" weight="500" color="tertiary">{{ vehicle.vehicleId }}</Text>
				</Flex>
				<Icon name="arrow-top-right" size="14" color="blue" />
			</Flex>
		</Flex>

		<Flex align="center" justify="between" :class="$style.summary">
			<Flex align="center" gap="8">
				<div :class="$style.dot" style="background: var(--neon-cyan);" />
				<Text size="12" weight="500" color="tertiary">Pro: {{ vehiclesByClass.Pro?.length || 0 }}</Text>
			</Flex>
			<Flex align="center" gap="8">
				<div :class="$style.dot" style="background: var(--neon-magenta);" />
				<Text size="12" weight="500" color="tertiary">Am: {{ vehiclesByClass.Am?.length || 0 }}</Text>
			</Flex>
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	background: var(--card-background);
	padding: 20px;
	border-radius: 12px;
	border: 2px solid var(--card-border);
	min-width: 350px;
	max-height: 600px;
	display: flex;
	flex-direction: column;
}

.vehicleList {
	flex: 1;
	overflow-y: auto;
	padding-right: 8px;
}

.vehicleCard {
	background: rgba(0, 0, 0, 0.4);
	padding: 10px 12px;
	border-radius: 6px;
	border: 1px solid var(--op-10);
	cursor: pointer;
	transition: all 0.3s ease;
}

.vehicleCard:hover {
	background: rgba(0, 255, 157, 0.1);
	border-color: var(--neon-lime);
	transform: translateX(4px);
}

.position {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	border: 1px solid var(--op-10);
}

.classBadge {
	padding: 2px 6px;
	border-radius: 3px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}

.summary {
	padding-top: 16px;
	border-top: 1px solid var(--op-10);
}

.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	box-shadow: 0 0 8px currentColor;
}
</style>
