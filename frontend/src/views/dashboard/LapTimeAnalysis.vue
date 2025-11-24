<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLapAnalysisStore } from '@/stores/lapAnalysis'
import { fetchVehicles } from '@/services/api/racing'
import { formatLapTime, formatCarNumber, getClassColor } from '@/services/formatters'
import { useCountUp } from '@/composables/useCountUp'
import MultiLineChart from '@/components/charts/MultiLineChart.vue'
import HistogramChart from '@/components/charts/HistogramChart.vue'

const lapStore = useLapAnalysisStore()
const vehicles = ref([])
const showVehicleSelector = ref(false)
const sortColumn = ref('lap')
const sortOrder = ref('asc')

const stats = computed(() => lapStore.overallStats)
const animatedTotalLaps = useCountUp(computed(() => stats.value.totalLaps), 1000)
const animatedFastestLap = useCountUp(computed(() => stats.value.fastestLap), 1200)
const animatedAverageLap = useCountUp(computed(() => stats.value.averageLap), 1200)

const lapProgressionSeries = computed(() => {
	return lapStore.selectedVehicleIds.map(vehicleId => {
		const stats = lapStore.vehicleStats[vehicleId]
		if (!stats || !stats.laps) return null

		return {
			name: vehicles.value.find(v => v.vehicleId === vehicleId)?.carNumber || vehicleId,
			data: stats.laps.map(lap => ({
				x: lap.lap,
				y: lap.lapTime
			}))
		}
	}).filter(Boolean)
})

const histogramData = computed(() => {
	return lapStore.filteredLapData.map(lap => ({
		value: lap.lapTime
	}))
})

const tableData = computed(() => {
	let data = [...lapStore.filteredLapData]

	data.sort((a, b) => {
		const aVal = a[sortColumn.value]
		const bVal = b[sortColumn.value]

		if (sortOrder.value === 'asc') {
			return aVal > bVal ? 1 : -1
		} else {
			return aVal < bVal ? 1 : -1
		}
	})

	return data
})

const loadData = async () => {
	try {
		const [vehiclesResult] = await Promise.all([
			fetchVehicles(),
			lapStore.loadLapData({ limit: 1000 })
		])

		vehicles.value = vehiclesResult.data || []
	} catch (error) {
		console.error('Failed to load data:', error)
	}
}

const toggleVehicle = (vehicleId) => {
	lapStore.toggleVehicle(vehicleId)
}

const setClassFilter = (classValue) => {
	lapStore.setClassFilter(classValue)
}

const setSorting = (column) => {
	if (sortColumn.value === column) {
		sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortColumn.value = column
		sortOrder.value = 'asc'
	}
}

onMounted(() => {
	loadData()
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24" wide>
			<Flex align="center" justify="between" wrap>
				<Text size="24" weight="700" color="primary">LAP TIME ANALYSIS</Text>

				<Flex align="center" gap="12">
					<button
						v-for="classValue in ['all', 'pro', 'am']"
						:key="classValue"
						@click="setClassFilter(classValue)"
						:class="[$style.classButton, lapStore.classFilter === classValue && $style.active]"
					>
						<Text size="11" weight="700" :color="lapStore.classFilter === classValue ? 'green' : 'tertiary'">
							{{ classValue.toUpperCase() }}
						</Text>
					</button>

					<button
						@click="showVehicleSelector = !showVehicleSelector"
						:class="$style.vehicleButton"
					>
						<Icon name="arrow-top-right" size="16" color="blue" />
						<Text size="11" weight="700" color="blue">
							SELECT VEHICLES ({{ lapStore.selectedVehicleIds.length }})
						</Text>
					</button>
				</Flex>
			</Flex>

			<div v-if="showVehicleSelector" :class="$style.vehicleSelector">
				<Flex direction="column" gap="12">
					<Text size="14" weight="700" color="primary">SELECT VEHICLES TO COMPARE</Text>
					<Flex wrap gap="8">
						<button
							v-for="vehicle in vehicles"
							:key="vehicle.vehicleId"
							@click="toggleVehicle(vehicle.vehicleId)"
							:class="[$style.vehicleChip, lapStore.selectedVehicleIds.includes(vehicle.vehicleId) && $style.selected]"
						>
							<Text size="12" weight="700" color="primary" mono>
								{{ formatCarNumber(vehicle.carNumber) }}
							</Text>
							<div :class="$style.classBadge" :style="{ borderColor: getClassColor(vehicle.class) }">
								<Text size="8" weight="700" :style="{ color: getClassColor(vehicle.class) }">
									{{ vehicle.class }}
								</Text>
							</div>
						</button>
					</Flex>
				</Flex>
			</div>

			<Flex gap="20" wrap :class="$style.statsRow">
				<div :class="$style.statCard">
					<Icon name="check-circle" size="32" color="blue" />
					<Text size="14" weight="600" color="tertiary">TOTAL LAPS</Text>
					<Text size="36" weight="700" color="primary" mono>
						{{ Math.round(animatedTotalLaps) }}
					</Text>
				</div>

				<div :class="$style.statCard">
					<Icon name="zap-circle" size="32" color="green" />
					<Text size="14" weight="600" color="tertiary">FASTEST LAP</Text>
					<Text size="28" weight="700" color="green" mono>
						{{ formatLapTime(Math.round(animatedFastestLap)) }}
					</Text>
				</div>

				<div :class="$style.statCard">
					<Icon name="clock" size="32" color="cyan" />
					<Text size="14" weight="600" color="tertiary">AVERAGE LAP</Text>
					<Text size="28" weight="700" color="cyan" mono>
						{{ formatLapTime(Math.round(animatedAverageLap)) }}
					</Text>
				</div>
			</Flex>

			<div v-if="lapProgressionSeries.length > 0" :class="$style.chartCard">
				<Text size="16" weight="700" color="primary" style="margin-bottom: 16px;">
					LAP TIME PROGRESSION
				</Text>
				<MultiLineChart
					:series="lapProgressionSeries"
					x-key="x"
					y-key="y"
					:height="300"
					x-label="Lap Number"
					y-label="Lap Time (ms)"
				/>
			</div>

			<div v-if="histogramData.length > 0" :class="$style.chartCard">
				<Text size="16" weight="700" color="primary" style="margin-bottom: 16px;">
					LAP TIME DISTRIBUTION
				</Text>
				<Text size="12" weight="500" color="secondary" style="margin-bottom: 16px;">
					Shows consistency patterns across all laps
				</Text>
				<HistogramChart
					:data="histogramData"
					value-key="value"
					:bins="15"
					color="var(--electric-blue)"
					:height="250"
					x-label="Lap Time (ms)"
					y-label="Frequency"
				/>
			</div>

			<div :class="$style.tableCard">
				<Flex align="center" justify="between" style="margin-bottom: 16px;">
					<Text size="16" weight="700" color="primary">LAP TIMES</Text>
					<Text size="12" weight="500" color="tertiary">{{ tableData.length }} laps</Text>
				</Flex>

				<div :class="$style.tableWrapper">
					<table :class="$style.table">
						<thead>
							<tr>
								<th @click="setSorting('lap')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">LAP</Text>
										<Icon v-if="sortColumn === 'lap'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
								<th @click="setSorting('vehicleId')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">VEHICLE</Text>
										<Icon v-if="sortColumn === 'vehicleId'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
								<th @click="setSorting('lapTime')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">TIME</Text>
										<Icon v-if="sortColumn === 'lapTime'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
								<th @click="setSorting('s1Time')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">S1</Text>
										<Icon v-if="sortColumn === 's1Time'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
								<th @click="setSorting('s2Time')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">S2</Text>
										<Icon v-if="sortColumn === 's2Time'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
								<th @click="setSorting('s3Time')">
									<Flex align="center" gap="6">
										<Text size="11" weight="700" color="tertiary">S3</Text>
										<Icon v-if="sortColumn === 's3Time'" :name="sortOrder === 'asc' ? 'arrow-top-right' : 'arrow-left'" size="12" color="tertiary" />
									</Flex>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="lap in tableData.slice(0, 100)" :key="`${lap.vehicleId}-${lap.lap}`" :class="$style.tableRow">
								<td>
									<Text size="12" weight="600" color="primary" mono>{{ lap.lap }}</Text>
								</td>
								<td>
									<Flex align="center" gap="6">
										<Text size="12" weight="600" color="primary" mono>
											{{ formatCarNumber(vehicles.find(v => v.vehicleId === lap.vehicleId)?.carNumber || lap.vehicleId) }}
										</Text>
										<div v-if="lap.class" :class="$style.classBadge" :style="{ borderColor: getClassColor(lap.class) }">
											<Text size="8" weight="700" :style="{ color: getClassColor(lap.class) }">
												{{ lap.class }}
											</Text>
										</div>
									</Flex>
								</td>
								<td>
									<Text size="12" weight="700" color="green" mono>{{ formatLapTime(lap.lapTime) }}</Text>
								</td>
								<td>
									<Text size="11" weight="600" color="secondary" mono>{{ formatLapTime(lap.s1Time) }}</Text>
								</td>
								<td>
									<Text size="11" weight="600" color="secondary" mono>{{ formatLapTime(lap.s2Time) }}</Text>
								</td>
								<td>
									<Text size="11" weight="600" color="secondary" mono>{{ formatLapTime(lap.s3Time) }}</Text>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
	padding: 20px;
}

.classButton, .vehicleButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.classButton:hover, .vehicleButton:hover {
	background: rgba(255, 255, 255, 0.1);
	transform: translateY(-2px);
}

.classButton.active {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
}

.vehicleSelector {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
}

.vehicleChip {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.vehicleChip:hover {
	background: rgba(255, 255, 255, 0.1);
	transform: translateY(-2px);
}

.vehicleChip.selected {
	background: rgba(0, 255, 157, 0.15);
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.classBadge {
	padding: 2px 6px;
	border-radius: 3px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}

.statsRow {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.statCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	transition: all 0.3s ease;
}

.statCard:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 25px rgba(0, 255, 255, 0.2);
}

.chartCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
}

.tableCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
}

.tableWrapper {
	overflow-x: auto;
	border-radius: 6px;
}

.table {
	width: 100%;
	border-collapse: collapse;
}

.table thead tr {
	background: rgba(255, 255, 255, 0.03);
	border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.table th {
	padding: 12px 16px;
	text-align: left;
	cursor: pointer;
	transition: background 0.3s ease;
}

.table th:hover {
	background: rgba(255, 255, 255, 0.05);
}

.tableRow {
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	transition: background 0.3s ease;
}

.tableRow:hover {
	background: rgba(255, 255, 255, 0.03);
}

.table td {
	padding: 12px 16px;
}

@media (max-width: 768px) {
	.statsRow {
		grid-template-columns: 1fr;
	}

	.tableWrapper {
		overflow-x: scroll;
	}
}
</style>
