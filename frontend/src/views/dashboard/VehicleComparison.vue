<script setup>
import { ref, onMounted, computed } from "vue"
import { fetchVehicles, fetchLapComparison } from "@/services/api/racing"
import { formatLapTime, formatSpeed, formatCarNumber, getClassColor } from "@/services/formatters"
import LineChart from "@/components/charts/LineChart.vue"
import BarChart from "@/components/charts/BarChart.vue"

const loading = ref(true)
const vehicles = ref([])
const selectedVehicleIds = ref([])
const comparisonData = ref(null)

const loadVehicles = async () => {
	loading.value = true
	try {
		const result = await fetchVehicles({ sortBy: 'fastest_lap', order: 'asc' })
		vehicles.value = result.data || []

		if (vehicles.value.length >= 2) {
			selectedVehicleIds.value = [vehicles.value[0].vehicleId, vehicles.value[1].vehicleId]
			await loadComparison()
		}
	} catch (error) {
		console.error('Failed to load vehicles:', error)
	} finally {
		loading.value = false
	}
}

const loadComparison = async () => {
	if (selectedVehicleIds.value.length < 2) return

	try {
		const result = await fetchLapComparison(selectedVehicleIds.value, { minLap: 1, maxLap: 20 })
		comparisonData.value = result.data
	} catch (error) {
		console.error('Failed to load comparison:', error)
	}
}

const selectedVehicles = computed(() => {
	return vehicles.value.filter(v => selectedVehicleIds.value.includes(v.vehicleId))
})

const comparisonMetrics = computed(() => {
	return selectedVehicles.value.map(v => ({
		name: formatCarNumber(v.carNumber),
		fastestLap: v.statistics?.fastestLap || 0,
		avgLap: v.statistics?.averageLap || 0,
		maxSpeed: v.statistics?.maxSpeed || 0,
		totalLaps: v.statistics?.totalLaps || 0
	}))
})

const toggleVehicle = (vehicleId) => {
	const index = selectedVehicleIds.value.indexOf(vehicleId)
	if (index > -1) {
		if (selectedVehicleIds.value.length > 1) {
			selectedVehicleIds.value.splice(index, 1)
		}
	} else {
		if (selectedVehicleIds.value.length < 5) {
			selectedVehicleIds.value.push(vehicleId)
		}
	}
	loadComparison()
}

onMounted(loadVehicles)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">VEHICLE COMPARISON</Text>
					<Text size="14" weight="600" color="secondary">
						Compare performance metrics across multiple vehicles
					</Text>
				</Flex>
			</Flex>

			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING VEHICLES...</Text>
			</div>

			<div v-else>
				<Flex direction="column" gap="24">
					<div :class="$style.selectionPanel">
						<Text size="16" weight="700" color="primary" style="margin-bottom: 12px;">
							SELECT VEHICLES (2-5)
						</Text>
						<Flex gap="12" wrap>
							<button
								v-for="vehicle in vehicles.slice(0, 10)"
								:key="vehicle.vehicleId"
								:class="[$style.vehicleButton, selectedVehicleIds.includes(vehicle.vehicleId) && $style.selected]"
								@click="toggleVehicle(vehicle.vehicleId)"
							>
								<Text size="13" weight="700" :color="selectedVehicleIds.includes(vehicle.vehicleId) ? 'green' : 'secondary'">
									{{ formatCarNumber(vehicle.carNumber) }}
								</Text>
								<div :class="$style.classBadge" :style="{ borderColor: getClassColor(vehicle.class) }">
									<Text size="9" weight="700" :style="{ color: getClassColor(vehicle.class) }">
										{{ vehicle.class }}
									</Text>
								</div>
							</button>
						</Flex>
					</div>

					<div :class="$style.metricsGrid">
						<div :class="$style.metricCard">
							<Text size="14" weight="700" color="tertiary" style="margin-bottom: 12px;">FASTEST LAP</Text>
							<Flex direction="column" gap="8">
								<Flex
									v-for="vehicle in selectedVehicles"
									:key="vehicle.vehicleId"
									align="center"
									justify="between"
									:class="$style.metricRow"
								>
									<Text size="13" weight="600" color="primary">
										{{ formatCarNumber(vehicle.carNumber) }}
									</Text>
									<Text size="13" weight="600" color="secondary" mono>
										{{ formatLapTime(vehicle.statistics?.fastestLap) }}
									</Text>
								</Flex>
							</Flex>
						</div>

						<div :class="$style.metricCard">
							<Text size="14" weight="700" color="tertiary" style="margin-bottom: 12px;">MAX SPEED</Text>
							<Flex direction="column" gap="8">
								<Flex
									v-for="vehicle in selectedVehicles"
									:key="vehicle.vehicleId"
									align="center"
									justify="between"
									:class="$style.metricRow"
								>
									<Text size="13" weight="600" color="primary">
										{{ formatCarNumber(vehicle.carNumber) }}
									</Text>
									<Text size="13" weight="600" color="secondary" mono>
										{{ formatSpeed(vehicle.statistics?.maxSpeed) }}
									</Text>
								</Flex>
							</Flex>
						</div>
					</div>

					<div :class="$style.chartCard">
						<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
							PERFORMANCE COMPARISON
						</Text>
						<div v-if="comparisonMetrics.length" :class="$style.chartWrapper">
							<BarChart
								:data="comparisonMetrics"
								xKey="name"
								yKey="fastestLap"
								color="var(--neon-lime)"
								:height="300"
								xLabel="Vehicle"
								yLabel="Fastest Lap (ms)"
							/>
						</div>
					</div>
				</Flex>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
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

.selectionPanel {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 20px;
}

.vehicleButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.05);
	border: 2px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.vehicleButton.selected {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.vehicleButton:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.2);
}

.classBadge {
	padding: 2px 6px;
	border-radius: 3px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.metricCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
	transition: all 0.3s ease;
}

.metricCard:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
}

.metricRow {
	padding: 8px 12px;
	background: rgba(0, 0, 0, 0.4);
	border-radius: 4px;
	border: 1px solid var(--op-10);
}

.chartCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 20px;
}

.chartWrapper {
	background: rgba(0, 0, 0, 0.4);
	border-radius: 6px;
	padding: 16px;
}
</style>
