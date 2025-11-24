<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useTelemetryStore } from "@/stores/telemetry"
import { fetchVehicles } from "@/services/api/racing"
import { formatSpeed, formatCarNumber, getClassColor } from "@/services/formatters"
import RadialGauge from "@/components/charts/RadialGauge.vue"
import MultiLineChart from "@/components/charts/MultiLineChart.vue"

const telemetryStore = useTelemetryStore()
const vehicles = ref([])
const selectedVehicleId = ref(null)
const selectedLapNumber = ref(1)
const showVehicleSelector = ref(false)

const telemetry = computed(() => telemetryStore.currentTelemetry)
const isLiveMode = computed(() => telemetryStore.currentMode === 'live')
const isReplayMode = computed(() => telemetryStore.currentMode === 'replay')

const speed = computed(() => telemetry.value?.speed || 0)
const rpm = computed(() => telemetry.value?.rpm || 0)
const throttle = computed(() => telemetry.value?.throttle || 0)
const brake = computed(() => telemetry.value?.brake || 0)
const steering = computed(() => telemetry.value?.steering || 0)
const gear = computed(() => telemetry.value?.gear || 0)
const lap = computed(() => telemetry.value?.lap || 0)

const selectedVehicle = computed(() => {
	return vehicles.value.find(v => v.vehicleId === selectedVehicleId.value)
})

const chartData = computed(() => {
	if (isLiveMode.value && telemetryStore.telemetryData.length > 0) {
		return telemetryStore.telemetryData.slice(0, 50).reverse()
	} else if (isReplayMode.value && telemetryStore.replayData.length > 0) {
		const currentIndex = telemetryStore.currentReplayIndex
		const start = Math.max(0, currentIndex - 25)
		const end = Math.min(telemetryStore.replayData.length, currentIndex + 25)
		return telemetryStore.replayData.slice(start, end)
	}
	return []
})

const chartSeries = computed(() => {
	if (chartData.value.length === 0) return []

	return [
		{
			name: 'Speed',
			data: chartData.value.map((d, i) => ({ x: i, y: d.speed || 0 }))
		},
		{
			name: 'Throttle',
			data: chartData.value.map((d, i) => ({ x: i, y: d.throttle || 0 }))
		},
		{
			name: 'Brake',
			data: chartData.value.map((d, i) => ({ x: i, y: d.brake || 0 }))
		}
	]
})

const loadVehicles = async () => {
	try {
		const result = await fetchVehicles()
		vehicles.value = result.data || []
	} catch (error) {
		console.error('Failed to load vehicles:', error)
	}
}

const selectVehicle = (vehicle) => {
	selectedVehicleId.value = vehicle.vehicleId
	showVehicleSelector.value = false

	if (isLiveMode.value) {
		telemetryStore.startLiveMode(vehicle.vehicleId)
	}
}

const toggleMode = () => {
	if (isLiveMode.value) {
		telemetryStore.startReplay(selectedVehicleId.value, selectedLapNumber.value)
	} else {
		telemetryStore.startLiveMode(selectedVehicleId.value)
	}
}

const handlePlayPause = () => {
	if (telemetryStore.isPlaying) {
		telemetryStore.pauseReplay()
	} else {
		telemetryStore.resumeReplay()
	}
}

const handleSeek = (event) => {
	const percentage = parseFloat(event.target.value)
	telemetryStore.seekReplay(percentage)
}

const setSpeed = (speed) => {
	telemetryStore.setPlaybackSpeed(speed)
}

onMounted(() => {
	loadVehicles()
})

onUnmounted(() => {
	telemetryStore.reset()
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24" wide>
			<Flex align="center" justify="between" wrap>
				<Flex align="center" gap="16">
					<Flex align="center" gap="8">
						<div v-if="isLiveMode" :class="$style.liveDot" />
						<Text size="24" weight="700" color="primary">
							{{ isLiveMode ? 'LIVE TELEMETRY' : 'REPLAY MODE' }}
						</Text>
					</Flex>

					<button
						v-if="selectedVehicleId"
						@click="toggleMode"
						:class="$style.modeButton"
					>
						<Icon :name="isLiveMode ? 'clock' : 'zap-circle'" size="16" />
						<Text size="11" weight="700" color="primary">
							{{ isLiveMode ? 'SWITCH TO REPLAY' : 'SWITCH TO LIVE' }}
						</Text>
					</button>
				</Flex>

				<button
					@click="showVehicleSelector = !showVehicleSelector"
					:class="$style.selectButton"
				>
					<Icon name="arrow-top-right" size="16" color="green" />
					<Text size="12" weight="700" color="green">
						{{ selectedVehicle ? formatCarNumber(selectedVehicle.carNumber) : 'SELECT VEHICLE' }}
					</Text>
				</button>
			</Flex>

			<div v-if="showVehicleSelector" :class="$style.vehicleSelector">
				<Flex direction="column" gap="12">
					<Text size="14" weight="700" color="primary">SELECT VEHICLE</Text>
					<Flex direction="column" gap="8">
						<button
							v-for="vehicle in vehicles"
							:key="vehicle.vehicleId"
							@click="selectVehicle(vehicle)"
							:class="[$style.vehicleOption, selectedVehicleId === vehicle.vehicleId && $style.selected]"
						>
							<Flex align="center" gap="12" wide>
								<Text size="16" weight="700" color="primary" mono>
									{{ formatCarNumber(vehicle.carNumber) }}
								</Text>
								<div :class="$style.classBadge" :style="{ borderColor: getClassColor(vehicle.class) }">
									<Text size="9" weight="700" :style="{ color: getClassColor(vehicle.class) }">
										{{ vehicle.class }}
									</Text>
								</div>
								<Text size="11" weight="500" color="secondary">
									{{ vehicle.vehicleId }}
								</Text>
							</Flex>
						</button>
					</Flex>
				</Flex>
			</div>

			<div v-if="!selectedVehicleId" :class="$style.emptyState">
				<Icon name="arrow-top-right" size="64" color="blue" />
				<Text size="18" weight="700" color="primary">SELECT A VEHICLE</Text>
				<Text size="14" weight="500" color="secondary" align="center">
					Choose a vehicle from the list above to view real-time telemetry data
				</Text>
			</div>

			<template v-else>
				<Flex v-if="selectedVehicle" direction="column" gap="12" :class="$style.vehicleInfo">
					<Flex align="center" gap="12">
						<Text size="20" weight="700" color="primary" mono>
							{{ formatCarNumber(selectedVehicle.carNumber) }}
						</Text>
						<div :class="$style.classBadge" :style="{ borderColor: getClassColor(selectedVehicle.class) }">
							<Text size="10" weight="700" :style="{ color: getClassColor(selectedVehicle.class) }">
								{{ selectedVehicle.class }}
							</Text>
						</div>
						<Text size="12" weight="600" color="tertiary" mono>LAP {{ lap }}</Text>
					</Flex>
				</Flex>

				<Flex gap="20" :class="$style.gaugesRow" wrap>
					<div :class="$style.gaugeCard">
						<RadialGauge
							:value="speed"
							:min="0"
							:max="300"
							unit="km/h"
							label="SPEED"
							:size="180"
							:thickness="18"
							color="var(--neon-lime)"
							type="full"
							:show-needle="false"
						/>
					</div>

					<div :class="$style.gaugeCard">
						<RadialGauge
							:value="rpm"
							:min="0"
							:max="8000"
							unit="RPM"
							:label="`GEAR ${gear || 'N'}`"
							:size="180"
							:thickness="18"
							color="var(--electric-blue)"
							type="semi"
							:show-needle="true"
							:zones="[
								{ min: 0, max: 6000, color: 'var(--electric-blue)' },
								{ min: 6000, max: 7000, color: 'var(--neon-yellow)' },
								{ min: 7000, max: 8000, color: 'var(--neon-pink)' }
							]"
						/>
					</div>

					<Flex direction="column" gap="16" :class="$style.barsContainer">
						<div :class="$style.barCard">
							<Text size="11" weight="600" color="tertiary">THROTTLE</Text>
							<div :class="$style.verticalBar">
								<div :class="$style.barFill" :style="{ height: `${throttle}%`, background: 'linear-gradient(to top, rgba(0, 255, 157, 0.3), var(--neon-lime))' }" />
							</div>
							<Text size="16" weight="700" color="green" mono>{{ Math.round(throttle) }}%</Text>
						</div>

						<div :class="$style.barCard">
							<Text size="11" weight="600" color="tertiary">BRAKE</Text>
							<div :class="$style.verticalBar">
								<div :class="$style.barFill" :style="{ height: `${brake}%`, background: 'linear-gradient(to top, rgba(255, 20, 147, 0.3), var(--neon-pink))' }" />
							</div>
							<Text size="16" weight="700" color="pink" mono>{{ Math.round(brake) }}%</Text>
						</div>
					</Flex>

					<div :class="$style.steeringCard">
						<Text size="11" weight="600" color="tertiary">STEERING ANGLE</Text>
						<div :class="$style.steeringBar">
							<div :class="$style.steeringCenter" />
							<div
								:class="$style.steeringIndicator"
								:style="{ left: `${50 + steering}%` }"
							/>
						</div>
						<Text size="16" weight="700" color="cyan" mono>{{ Math.round(steering) }}°</Text>
					</div>
				</Flex>

				<div v-if="chartSeries.length > 0" :class="$style.chartCard">
					<Text size="14" weight="700" color="primary" style="margin-bottom: 12px;">
						TELEMETRY TIMELINE
					</Text>
					<MultiLineChart
						:series="chartSeries"
						x-key="x"
						y-key="y"
						:height="250"
						x-label="Data Points"
						y-label="Value"
						:colors="['var(--neon-lime)', 'var(--electric-blue)', 'var(--neon-pink)']"
					/>
				</div>

				<div v-if="isReplayMode" :class="$style.replayControls">
					<Flex align="center" gap="12" wide>
						<button @click="telemetryStore.skipToStart" :class="$style.controlButton">
							<Icon name="arrow-left" size="16" color="primary" />
						</button>

						<button @click="handlePlayPause" :class="$style.controlButton">
							<Icon :name="telemetryStore.isPlaying ? 'pause' : 'arrow-top-right'" size="16" color="green" />
						</button>

						<button @click="telemetryStore.skipToEnd" :class="$style.controlButton">
							<Icon name="arrow-right" size="16" color="primary" />
						</button>

						<input
							type="range"
							min="0"
							max="100"
							:value="telemetryStore.replayProgress"
							@input="handleSeek"
							:class="$style.seekBar"
						/>

						<Flex align="center" gap="6">
							<button
								v-for="speed in [0.5, 1, 2, 5]"
								:key="speed"
								@click="setSpeed(speed)"
								:class="[$style.speedButton, telemetryStore.playbackSpeed === speed && $style.active]"
							>
								<Text size="10" weight="700" :color="telemetryStore.playbackSpeed === speed ? 'green' : 'tertiary'">
									{{ speed }}x
								</Text>
							</button>
						</Flex>

						<input
							v-model.number="selectedLapNumber"
							type="number"
							min="1"
							placeholder="Lap"
							:class="$style.lapInput"
						/>

						<button
							@click="telemetryStore.startReplay(selectedVehicleId, selectedLapNumber)"
							:class="$style.loadLapButton"
						>
							<Text size="10" weight="700" color="blue">LOAD LAP</Text>
						</button>
					</Flex>
				</div>
			</template>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
	padding: 20px;
}

.liveDot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--neon-lime);
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		box-shadow: 0 0 10px var(--neon-lime);
	}
	50% {
		opacity: 0.6;
		box-shadow: 0 0 20px var(--neon-lime);
	}
}

.modeButton, .selectButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.modeButton:hover, .selectButton:hover {
	background: rgba(255, 255, 255, 0.1);
	transform: translateY(-2px);
}

.selectButton {
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
}

.vehicleSelector {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
}

.vehicleOption {
	width: 100%;
	padding: 12px;
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.vehicleOption:hover {
	background: rgba(255, 255, 255, 0.08);
	border-color: rgba(255, 255, 255, 0.2);
}

.vehicleOption.selected {
	background: rgba(0, 255, 157, 0.15);
	border-color: var(--neon-lime);
}

.classBadge {
	padding: 3px 8px;
	border-radius: 4px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}

.emptyState {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 80px 20px;
}

.vehicleInfo {
	background: rgba(255, 255, 255, 0.03);
	border-radius: 8px;
	padding: 16px;
}

.gaugesRow {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.gaugeCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
	display: flex;
	justify-content: center;
	align-items: center;
}

.barsContainer {
	display: flex;
	flex-direction: row;
	gap: 16px;
	grid-column: span 1;
}

.barCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	flex: 1;
}

.verticalBar {
	width: 40px;
	height: 120px;
	background: rgba(255, 255, 255, 0.05);
	border-radius: 20px;
	position: relative;
	overflow: hidden;
}

.barFill {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	transition: height 0.3s ease;
	border-radius: 20px;
	box-shadow: 0 0 15px currentColor;
}

.steeringCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 16px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	grid-column: span 1;
}

.steeringBar {
	width: 200px;
	height: 8px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	position: relative;
}

.steeringCenter {
	position: absolute;
	left: 50%;
	top: 0;
	bottom: 0;
	width: 2px;
	background: rgba(255, 255, 255, 0.3);
	transform: translateX(-50%);
}

.steeringIndicator {
	position: absolute;
	top: 50%;
	width: 16px;
	height: 16px;
	background: var(--neon-cyan);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	box-shadow: 0 0 10px var(--neon-cyan);
	transition: left 0.3s ease;
}

.chartCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 20px;
}

.replayControls {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 16px;
}

.controlButton {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.controlButton:hover {
	background: rgba(255, 255, 255, 0.1);
	transform: scale(1.1);
}

.seekBar {
	flex: 1;
	height: 6px;
	border-radius: 3px;
	background: rgba(255, 255, 255, 0.1);
	outline: none;
	-webkit-appearance: none;
}

.seekBar::-webkit-slider-thumb {
	-webkit-appearance: none;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: var(--neon-lime);
	cursor: pointer;
	box-shadow: 0 0 10px var(--neon-lime);
}

.speedButton {
	padding: 6px 10px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.speedButton.active {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
}

.speedButton:hover {
	background: rgba(255, 255, 255, 0.1);
}

.lapInput {
	width: 60px;
	padding: 8px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	color: var(--text-primary);
	font-family: var(--font-mono);
	font-size: 12px;
	text-align: center;
}

.loadLapButton {
	padding: 8px 12px;
	background: rgba(0, 174, 255, 0.2);
	border: 1px solid var(--electric-blue);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.loadLapButton:hover {
	background: rgba(0, 174, 255, 0.3);
	transform: translateY(-2px);
}

@media (max-width: 768px) {
	.gaugesRow {
		grid-template-columns: 1fr;
	}

	.barsContainer {
		flex-direction: row;
	}
}
</style>
