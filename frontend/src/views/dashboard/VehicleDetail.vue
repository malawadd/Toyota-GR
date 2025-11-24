<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchVehicleById, fetchLapTimes, fetchTelemetry } from '@/services/api/racing'
import { formatLapTime, formatSpeed, formatCarNumber, getClassColor } from '@/services/formatters'
import { useCountUp } from '@/composables/useCountUp'
import RadialGauge from '@/components/charts/RadialGauge.vue'
import LineChart from '@/components/charts/LineChart.vue'
import BarChart from '@/components/charts/BarChart.vue'

const route = useRoute()
const vehicleId = computed(() => route.params.vehicleId || route.query.vehicleId)

const vehicle = ref(null)
const lapTimes = ref([])
const telemetryStats = ref(null)
const loading = ref(true)

const fastestLap = computed(() => {
	if (!lapTimes.value.length) return 0
	return Math.min(...lapTimes.value.map(lap => lap.lapTime))
})

const averageLap = computed(() => {
	if (!lapTimes.value.length) return 0
	const total = lapTimes.value.reduce((sum, lap) => sum + lap.lapTime, 0)
	return total / lapTimes.value.length
})

const maxSpeed = computed(() => {
	return telemetryStats.value?.maxSpeed || 0
})

const consistency = computed(() => {
	if (lapTimes.value.length < 2) return 100

	const times = lapTimes.value.map(l => l.lapTime)
	const avg = averageLap.value
	const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length
	const stdDev = Math.sqrt(variance)

	const coefficient = (stdDev / avg) * 100
	return Math.max(0, Math.min(100, 100 - coefficient * 2))
})

const animatedFastestLap = useCountUp(computed(() => fastestLap.value), 1200)
const animatedMaxSpeed = useCountUp(computed(() => maxSpeed.value), 1000)
const animatedAvgLap = useCountUp(computed(() => averageLap.value), 1200)
const animatedConsistency = useCountUp(computed(() => consistency.value), 1500)

const lapProgressionData = computed(() => {
	return lapTimes.value.map(lap => ({
		x: lap.lap,
		y: lap.lapTime
	}))
})

const sectorData = computed(() => {
	if (!lapTimes.value.length) return []

	const bestS1 = Math.min(...lapTimes.value.map(l => l.s1Time || Infinity))
	const bestS2 = Math.min(...lapTimes.value.map(l => l.s2Time || Infinity))
	const bestS3 = Math.min(...lapTimes.value.map(l => l.s3Time || Infinity))

	return [
		{ label: 'S1', value: bestS1 },
		{ label: 'S2', value: bestS2 },
		{ label: 'S3', value: bestS3 }
	]
})

const loadData = async () => {
	try {
		loading.value = true

		const [vehicleResult, lapTimesResult, telemetryResult] = await Promise.all([
			fetchVehicleById(vehicleId.value),
			fetchLapTimes({ vehicleId: vehicleId.value, limit: 100 }),
			fetchTelemetry(vehicleId.value, { limit: 1000 })
		])

		vehicle.value = vehicleResult.data
		lapTimes.value = lapTimesResult.data || []

		const telemetryData = telemetryResult.data || []
		if (telemetryData.length > 0) {
			telemetryStats.value = {
				maxSpeed: Math.max(...telemetryData.map(t => t.speed || 0)),
				avgThrottle: telemetryData.reduce((sum, t) => sum + (t.throttle || 0), 0) / telemetryData.length,
				avgBrake: telemetryData.reduce((sum, t) => sum + (t.brake || 0), 0) / telemetryData.length,
				avgRPM: telemetryData.reduce((sum, t) => sum + (t.rpm || 0), 0) / telemetryData.length,
				maxRPM: Math.max(...telemetryData.map(t => t.rpm || 0))
			}
		}

		loading.value = false
	} catch (error) {
		console.error('Failed to load vehicle data:', error)
		loading.value = false
	}
}

onMounted(() => {
	loadData()
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24" wide>
			<div v-if="loading" :class="$style.loadingState">
				<div :class="$style.spinner" />
				<Text size="14" weight="600" color="tertiary">Loading vehicle data...</Text>
			</div>

			<template v-else-if="vehicle">
				<Flex direction="column" gap="16" :class="$style.header">
					<Flex align="center" gap="16">
						<Text size="36" weight="700" color="primary" mono>
							{{ formatCarNumber(vehicle.carNumber) }}
						</Text>
						<div :class="$style.classBadge" :style="{ borderColor: getClassColor(vehicle.class) }">
							<Text size="12" weight="700" :style="{ color: getClassColor(vehicle.class) }">
								{{ vehicle.class }}
							</Text>
						</div>
					</Flex>
					<Text size="14" weight="500" color="secondary" mono>{{ vehicle.vehicleId }}</Text>
					<Flex align="center" gap="20">
						<Flex direction="column" gap="4">
							<Text size="11" weight="600" color="tertiary">POSITION</Text>
							<Text size="20" weight="700" color="primary">{{ vehicle.position || 'N/A' }}</Text>
						</Flex>
						<Flex direction="column" gap="4">
							<Text size="11" weight="600" color="tertiary">TOTAL LAPS</Text>
							<Text size="20" weight="700" color="primary">{{ lapTimes.length }}</Text>
						</Flex>
					</Flex>
				</Flex>

				<Flex gap="20" wrap :class="$style.statsGrid">
					<div :class="$style.statCard">
						<Icon name="zap-circle" size="32" color="green" />
						<Text size="12" weight="600" color="tertiary">FASTEST LAP</Text>
						<Text size="28" weight="700" color="green" mono>
							{{ formatLapTime(Math.round(animatedFastestLap)) }}
						</Text>
					</div>

					<div :class="$style.statCard">
						<Icon name="arrow-top-right" size="32" color="blue" />
						<Text size="12" weight="600" color="tertiary">MAX SPEED</Text>
						<Text size="28" weight="700" color="blue" mono>
							{{ Math.round(animatedMaxSpeed) }} km/h
						</Text>
					</div>

					<div :class="$style.statCard">
						<Icon name="clock" size="32" color="cyan" />
						<Text size="12" weight="600" color="tertiary">AVG LAP TIME</Text>
						<Text size="24" weight="700" color="cyan" mono>
							{{ formatLapTime(Math.round(animatedAvgLap)) }}
						</Text>
					</div>

					<div :class="$style.statCard">
						<RadialGauge
							:value="animatedConsistency"
							:min="0"
							:max="100"
							unit="%"
							label="CONSISTENCY"
							:size="140"
							:thickness="14"
							color="var(--neon-lime)"
							type="full"
							:show-needle="false"
						/>
					</div>
				</Flex>

				<div v-if="lapProgressionData.length > 0" :class="$style.chartCard">
					<Text size="16" weight="700" color="primary" style="margin-bottom: 16px;">
						LAP TIME PROGRESSION
					</Text>
					<LineChart
						:data="lapProgressionData"
						x-key="x"
						y-key="y"
						color="var(--neon-lime)"
						:height="250"
						x-label="Lap Number"
						y-label="Lap Time (ms)"
					/>
				</div>

				<div v-if="sectorData.length > 0" :class="$style.chartCard">
					<Text size="16" weight="700" color="primary" style="margin-bottom: 16px;">
						BEST SECTOR TIMES
					</Text>
					<BarChart
						:data="sectorData"
						x-key="label"
						y-key="value"
						color="var(--electric-blue)"
						:height="200"
						y-label="Time (ms)"
					/>

					<Flex gap="16" style="margin-top: 24px;">
						<div v-for="sector in sectorData" :key="sector.label" :class="$style.sectorCard">
							<Text size="11" weight="600" color="tertiary">{{ sector.label }}</Text>
							<Text size="20" weight="700" color="blue" mono>
								{{ formatLapTime(sector.value) }}
							</Text>
						</div>
					</Flex>

					<div :class="$style.theoreticalLap">
						<Text size="12" weight="600" color="tertiary">BEST THEORETICAL LAP</Text>
						<Text size="24" weight="700" color="green" mono>
							{{ formatLapTime(sectorData.reduce((sum, s) => sum + s.value, 0)) }}
						</Text>
					</div>
				</div>

				<div v-if="telemetryStats" :class="$style.telemetryCard">
					<Text size="16" weight="700" color="primary" style="margin-bottom: 20px;">
						TELEMETRY STATISTICS
					</Text>
					<Flex gap="16" wrap :class="$style.telemetryGrid">
						<div :class="$style.telemetryStat">
							<Text size="11" weight="600" color="tertiary">AVG THROTTLE</Text>
							<Text size="20" weight="700" color="green" mono>
								{{ Math.round(telemetryStats.avgThrottle) }}%
							</Text>
						</div>
						<div :class="$style.telemetryStat">
							<Text size="11" weight="600" color="tertiary">AVG BRAKE</Text>
							<Text size="20" weight="700" color="pink" mono>
								{{ Math.round(telemetryStats.avgBrake) }}%
							</Text>
						</div>
						<div :class="$style.telemetryStat">
							<Text size="11" weight="600" color="tertiary">AVG RPM</Text>
							<Text size="20" weight="700" color="blue" mono>
								{{ Math.round(telemetryStats.avgRPM) }}
							</Text>
						</div>
						<div :class="$style.telemetryStat">
							<Text size="11" weight="600" color="tertiary">MAX RPM</Text>
							<Text size="20" weight="700" color="cyan" mono>
								{{ Math.round(telemetryStats.maxRPM) }}
							</Text>
						</div>
					</Flex>
				</div>
			</template>

			<div v-else :class="$style.emptyState">
				<Icon name="alert-circle" size="64" color="pink" />
				<Text size="18" weight="700" color="primary">VEHICLE NOT FOUND</Text>
				<Text size="14" weight="500" color="secondary">
					Unable to load vehicle data
				</Text>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
	padding: 20px;
}

.loadingState {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 80px 20px;
}

.spinner {
	width: 40px;
	height: 40px;
	border: 3px solid rgba(0, 255, 157, 0.2);
	border-top: 3px solid var(--neon-lime);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.header {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
	animation: slideIn 0.5s ease;
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(20px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.classBadge {
	padding: 4px 12px;
	border-radius: 6px;
	border: 2px solid;
	background: rgba(0, 0, 0, 0.3);
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
	animation: fadeIn 0.6s ease forwards;
	opacity: 0;
}

.statCard:nth-child(1) { animation-delay: 0.1s; }
.statCard:nth-child(2) { animation-delay: 0.2s; }
.statCard:nth-child(3) { animation-delay: 0.3s; }
.statCard:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeIn {
	to {
		opacity: 1;
	}
}

.statCard:hover {
	transform: translateY(-6px);
	box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
}

.chartCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
}

.sectorCard {
	flex: 1;
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	transition: all 0.3s ease;
}

.sectorCard:hover {
	background: rgba(255, 255, 255, 0.06);
	transform: translateY(-2px);
}

.theoreticalLap {
	margin-top: 20px;
	padding: 20px;
	background: rgba(0, 255, 157, 0.1);
	border: 2px solid var(--neon-lime);
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.telemetryCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
}

.telemetryGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 16px;
}

.telemetryStat {
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	transition: all 0.3s ease;
}

.telemetryStat:hover {
	background: rgba(255, 255, 255, 0.06);
	transform: scale(1.05);
}

.emptyState {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 80px 20px;
}

@media (max-width: 768px) {
	.statsGrid {
		grid-template-columns: 1fr;
	}

	.telemetryGrid {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>
