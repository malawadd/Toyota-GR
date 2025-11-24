<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { fetchVehicles, fetchTelemetry } from "@/services/api/racing"
import { formatSpeed, formatCarNumber, getClassColor } from "@/services/formatters"

const router = useRouter()
const vehicles = ref([])
const currentVehicleIndex = ref(0)
const telemetryData = ref(null)
const loading = ref(true)

let pollingInterval = null
let cycleInterval = null

const currentVehicle = computed(() => {
	if (!vehicles.value.length) return null
	return vehicles.value[currentVehicleIndex.value]
})

const speed = computed(() => telemetryData.value?.speed || 0)
const rpm = computed(() => telemetryData.value?.rpm || 0)
const gear = computed(() => telemetryData.value?.gear || 0)
const lap = computed(() => telemetryData.value?.lap || 0)

const rpmPercentage = computed(() => {
	return Math.min((rpm.value / 8000) * 100, 100)
})

const loadVehiclesAndTelemetry = async () => {
	try {
		const vehiclesResult = await fetchVehicles({ limit: 3 })
		vehicles.value = vehiclesResult.data || []

		if (vehicles.value.length > 0) {
			await updateTelemetry()
		}

		loading.value = false
	} catch (error) {
		console.error('Failed to load vehicles:', error)
		loading.value = false
	}
}

const updateTelemetry = async () => {
	if (!currentVehicle.value) return

	try {
		const result = await fetchTelemetry(currentVehicle.value.vehicleId, { limit: 1 })
		if (result.data && result.data.length > 0) {
			telemetryData.value = result.data[0]
		}
	} catch (error) {
		console.error('Failed to fetch telemetry:', error)
	}
}

const cycleVehicle = () => {
	if (vehicles.value.length > 1) {
		currentVehicleIndex.value = (currentVehicleIndex.value + 1) % vehicles.value.length
		updateTelemetry()
	}
}

const goToLiveTelemetry = () => {
	router.push('/dashboard/live-telemetry')
}

onMounted(() => {
	loadVehiclesAndTelemetry()

	pollingInterval = setInterval(updateTelemetry, 3000)

	cycleInterval = setInterval(cycleVehicle, 10000)
})

onUnmounted(() => {
	if (pollingInterval) clearInterval(pollingInterval)
	if (cycleInterval) clearInterval(cycleInterval)
})
</script>

<template>
	<div :class="$style.widget" @click="goToLiveTelemetry">
		<Flex direction="column" gap="16" wide>
			<Flex align="center" justify="between">
				<Flex align="center" gap="8">
					<div :class="$style.liveDot" />
					<Text size="12" weight="700" color="green">LIVE TELEMETRY</Text>
				</Flex>
				<Icon name="arrow-top-right" size="16" color="green" />
			</Flex>

			<div v-if="loading" :class="$style.loadingState">
				<div :class="$style.spinner" />
				<Text size="11" weight="600" color="tertiary">Loading...</Text>
			</div>

			<div v-else-if="currentVehicle" :class="$style.content">
				<Flex align="center" justify="between" style="margin-bottom: 12px;">
					<Flex align="center" gap="8">
						<Text size="18" weight="700" color="primary">
							{{ formatCarNumber(currentVehicle.carNumber) }}
						</Text>
						<div :class="$style.classBadge" :style="{ borderColor: getClassColor(currentVehicle.class) }">
							<Text size="9" weight="700" :style="{ color: getClassColor(currentVehicle.class) }">
								{{ currentVehicle.class }}
							</Text>
						</div>
					</Flex>
					<Text size="11" weight="600" color="tertiary" mono>
						LAP {{ lap }}
					</Text>
				</Flex>

				<Flex align="center" gap="20" wide>
					<div :class="$style.miniGauge">
						<svg :class="$style.gaugeSvg" viewBox="0 0 100 100">
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="none"
								stroke="rgba(255, 255, 255, 0.1)"
								stroke-width="8"
							/>
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="none"
								stroke="var(--neon-lime)"
								stroke-width="8"
								:stroke-dasharray="`${(speed / 300) * 251.2} 251.2`"
								stroke-linecap="round"
								transform="rotate(-90 50 50)"
								:class="$style.gaugeProgress"
							/>
						</svg>
						<div :class="$style.gaugeCenter">
							<Text size="20" weight="700" color="green" mono>{{ Math.round(speed) }}</Text>
							<Text size="8" weight="600" color="tertiary">km/h</Text>
						</div>
					</div>

					<Flex direction="column" gap="12" style="flex: 1;">
						<Flex direction="column" gap="4">
							<Flex align="center" justify="between">
								<Text size="10" weight="600" color="tertiary">RPM</Text>
								<Text size="12" weight="700" color="blue" mono>{{ Math.round(rpm) }}</Text>
							</Flex>
							<div :class="$style.rpmBar">
								<div
									:class="$style.rpmFill"
									:style="{ width: `${rpmPercentage}%` }"
								/>
							</div>
						</Flex>

						<Flex align="center" justify="between">
							<Text size="10" weight="600" color="tertiary">GEAR</Text>
							<Text size="16" weight="700" color="primary" mono>{{ gear || 'N' }}</Text>
						</Flex>
					</Flex>
				</Flex>

				<div v-if="vehicles.length > 1" :class="$style.indicators">
					<div
						v-for="(_, index) in vehicles"
						:key="index"
						:class="[$style.indicator, index === currentVehicleIndex && $style.active]"
					/>
				</div>
			</div>

			<div v-else :class="$style.emptyState">
				<Text size="11" weight="500" color="support">No live data available</Text>
			</div>
		</Flex>
	</div>
</template>

<style module>
.widget {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.widget::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: radial-gradient(circle at top right, rgba(0, 255, 157, 0.1), transparent 60%);
	opacity: 0;
	transition: opacity 0.3s ease;
	pointer-events: none;
}

.widget:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.3);
	border-color: var(--neon-lime);
}

.widget:hover::before {
	opacity: 1;
}

.liveDot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--neon-lime);
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		box-shadow: 0 0 8px var(--neon-lime);
	}
	50% {
		opacity: 0.6;
		box-shadow: 0 0 15px var(--neon-lime);
	}
}

.loadingState {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 20px;
}

.spinner {
	width: 24px;
	height: 24px;
	border: 2px solid rgba(0, 255, 157, 0.2);
	border-top: 2px solid var(--neon-lime);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.content {
	position: relative;
}

.classBadge {
	padding: 2px 6px;
	border-radius: 3px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}

.miniGauge {
	position: relative;
	width: 100px;
	height: 100px;
	flex-shrink: 0;
}

.gaugeSvg {
	width: 100%;
	height: 100%;
}

.gaugeProgress {
	filter: drop-shadow(0 0 8px var(--neon-lime));
	transition: stroke-dasharray 0.5s ease;
}

.gaugeCenter {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
}

.rpmBar {
	width: 100%;
	height: 6px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 3px;
	overflow: hidden;
	position: relative;
}

.rpmFill {
	height: 100%;
	background: linear-gradient(to right, var(--electric-blue), var(--neon-cyan));
	border-radius: 3px;
	transition: width 0.3s ease;
	box-shadow: 0 0 10px currentColor;
}

.indicators {
	display: flex;
	gap: 6px;
	justify-content: center;
	margin-top: 12px;
}

.indicator {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	transition: all 0.3s ease;
}

.indicator.active {
	background: var(--neon-lime);
	box-shadow: 0 0 8px var(--neon-lime);
}

.emptyState {
	display: flex;
	justify-content: center;
	padding: 20px;
}
</style>
