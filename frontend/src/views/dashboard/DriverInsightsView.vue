<template>
	<div :class="$style.driverInsightsView">
		<!-- Header -->
		<div :class="$style.header">
			<div :class="$style.headerContent">
				<Text size="32" weight="700" color="primary">DRIVER TRAINING & INSIGHTS</Text>
				<Text size="14" weight="500" color="secondary">AI-Powered Performance Analysis & What-If Scenarios</Text>
			</div>
		</div>

		<!-- Vehicle & Lap Selection -->
		<div :class="$style.selectionPanel">
			<div :class="$style.sectionHeader">
				<Text size="16" weight="700" color="primary">SELECT VEHICLE & LAPS</Text>
			</div>
			
			<div :class="$style.selectionGrid">
				<div :class="$style.selectBox">
					<Text size="12" weight="600" color="tertiary">VEHICLE</Text>
					<select v-model="selectedVehicleId" @change="onVehicleChange" :class="$style.select">
						<option :value="null">Select Vehicle...</option>
						<option v-for="vehicle in vehicles" :key="vehicle.vehicleId" :value="vehicle.vehicleId">
							{{ vehicle.vehicleId }} - Car #{{ vehicle.carNumber }}
						</option>
					</select>
				</div>

				<div :class="$style.selectBox">
					<Text size="12" weight="600" color="tertiary">YOUR LAP</Text>
					<select v-model="selectedLap1" @change="onLap1Change" :class="$style.select">
						<option :value="null">Select Lap...</option>
						<option v-for="lap in availableLaps" :key="lap" :value="lap">
							Lap {{ lap }}
						</option>
					</select>
				</div>

				<div :class="$style.selectBox">
					<Text size="12" weight="600" color="tertiary">REFERENCE LAP (OPTIONAL)</Text>
					<select v-model="selectedLap2" @change="onLap2Change" :class="$style.select">
						<option :value="null">None</option>
						<option v-for="lap in availableLaps" :key="lap" :value="lap" :disabled="lap === selectedLap1">
							Lap {{ lap }}
						</option>
					</select>
				</div>
			</div>

			<button 
				:class="$style.analyzeBtn" 
				@click="runAnalysis" 
				:disabled="!selectedLap1 || analyzing || loading"
			>
				<Text size="14" weight="700" color="primary">
					{{ analyzing ? '🤖 ANALYZING...' : loading ? '⏳ LOADING...' : '🚀 ANALYZE PERFORMANCE' }}
				</Text>
			</button>
		</div>

		<!-- Error Display -->
		<div v-if="error" :class="$style.errorBox">
			<Text size="13" weight="600" color="error">⚠️ {{ error }}</Text>
		</div>

		<!-- What-If Scenario Simulator -->
		<div v-if="selectedVehicleId && selectedLap1" :class="$style.whatIfPanel">
			<div :class="$style.sectionHeader">
				<Text size="16" weight="700" color="primary">WHAT-IF SCENARIO SIMULATOR</Text>
				<Text size="12" weight="500" color="secondary">Adjust parameters to see how they would affect race position</Text>
			</div>

			<div :class="$style.scenarioGrid">
				<div :class="$style.scenarioControl">
					<div :class="$style.controlHeader">
						<Icon name="zap" size="16" color="primary" />
						<Text size="13" weight="600" color="secondary">SPEED IMPROVEMENT</Text>
					</div>
					<div :class="$style.sliderContainer">
						<input 
							type="range" 
							v-model="speedImprovement" 
							min="0" 
							max="20" 
							step="0.5"
							:class="$style.slider"
						/>
						<Text size="14" weight="700" color="primary">+{{ speedImprovement }} km/h</Text>
					</div>
				</div>

				<div :class="$style.scenarioControl">
					<div :class="$style.controlHeader">
						<Icon name="check-circle" size="16" color="primary" />
						<Text size="13" weight="600" color="secondary">BRAKING EFFICIENCY</Text>
					</div>
					<div :class="$style.sliderContainer">
						<input 
							type="range" 
							v-model="brakingImprovement" 
							min="0" 
							max="30" 
							step="1"
							:class="$style.slider"
						/>
						<Text size="14" weight="700" color="primary">+{{ brakingImprovement }}%</Text>
					</div>
				</div>

				<div :class="$style.scenarioControl">
					<div :class="$style.controlHeader">
						<Icon name="arrow-top-right" size="16" color="primary" />
						<Text size="13" weight="600" color="secondary">CORNER EXIT SPEED</Text>
					</div>
					<div :class="$style.sliderContainer">
						<input 
							type="range" 
							v-model="cornerExitImprovement" 
							min="0" 
							max="15" 
							step="0.5"
							:class="$style.slider"
						/>
						<Text size="14" weight="700" color="primary">+{{ cornerExitImprovement }} km/h</Text>
					</div>
				</div>

				<div :class="$style.scenarioControl">
					<div :class="$style.controlHeader">
						<Icon name="zap-circle" size="16" color="primary" />
						<Text size="13" weight="600" color="secondary">LAP TIME REDUCTION</Text>
					</div>
					<div :class="$style.sliderContainer">
						<input 
							type="range" 
							v-model="lapTimeReduction" 
							min="0" 
							max="5" 
							step="0.1"
							:class="$style.slider"
						/>
						<Text size="14" weight="700" color="primary">-{{ lapTimeReduction }}s</Text>
					</div>
				</div>
			</div>

			<button :class="$style.simulateBtn" @click="runScenarioSimulation">
				<Text size="14" weight="700" color="primary">⚡ SIMULATE SCENARIO</Text>
			</button>

			<!-- Scenario Results -->
			<div v-if="scenarioResult" :class="$style.scenarioResults">
				<div :class="$style.resultCard">
					<Text size="12" weight="600" color="tertiary">CURRENT POSITION</Text>
					<Text size="48" weight="700" color="primary">#{{ scenarioResult.currentPosition }}</Text>
				</div>
				<div :class="$style.resultArrow">
					<Icon name="arrow-top-right" size="32" color="primary" />
				</div>
				<div :class="[$style.resultCard, $style.improved]">
					<Text size="12" weight="600" color="tertiary">PROJECTED POSITION</Text>
					<Text size="48" weight="700" color="primary">#{{ scenarioResult.projectedPosition }}</Text>
				</div>
				<div :class="$style.resultDetails">
					<Text size="13" weight="600" color="secondary">
						{{ scenarioResult.positionChange > 0 ? `↑ ${scenarioResult.positionChange} positions gained` : 'No change' }}
					</Text>
					<Text size="12" weight="500" color="tertiary">
						Estimated lap time: {{ formatLapTime(scenarioResult.projectedLapTime) }}
					</Text>
				</div>
			</div>
		</div>

		<!-- Performance Metrics -->
		<div v-if="performanceMetrics" :class="$style.metricsPanel">
			<div :class="$style.sectionHeader">
				<Text size="16" weight="700" color="primary">PERFORMANCE METRICS</Text>
			</div>

			<div :class="$style.metricsGrid">
				<div :class="$style.metricCard">
					<Icon name="zap" size="20" color="primary" />
					<div :class="$style.metricContent">
						<Text size="11" weight="600" color="tertiary">MAX SPEED</Text>
						<Text size="24" weight="700" color="primary">{{ performanceMetrics.lap1.stats.maxSpeed.toFixed(1) }}</Text>
						<Text size="11" weight="500" color="secondary">km/h</Text>
					</div>
				</div>

				<div :class="$style.metricCard">
					<Icon name="arrow-top-right" size="20" color="primary" />
					<div :class="$style.metricContent">
						<Text size="11" weight="600" color="tertiary">AVG SPEED</Text>
						<Text size="24" weight="700" color="primary">{{ performanceMetrics.lap1.stats.avgSpeed.toFixed(1) }}</Text>
						<Text size="11" weight="500" color="secondary">km/h</Text>
					</div>
				</div>

				<div :class="$style.metricCard">
					<Icon name="zap-circle" size="20" color="primary" />
					<div :class="$style.metricContent">
						<Text size="11" weight="600" color="tertiary">MAX RPM</Text>
						<Text size="24" weight="700" color="primary">{{ performanceMetrics.lap1.stats.maxRPM.toFixed(0) }}</Text>
						<Text size="11" weight="500" color="secondary">RPM</Text>
					</div>
				</div>

				<div :class="$style.metricCard" v-if="performanceMetrics.lap1.brakingEfficiency">
					<Icon name="check-circle" size="20" color="primary" />
					<div :class="$style.metricContent">
						<Text size="11" weight="600" color="tertiary">BRAKING EFFICIENCY</Text>
						<Text size="24" weight="700" color="primary">{{ performanceMetrics.lap1.brakingEfficiency.efficiency.toFixed(1) }}</Text>
						<Text size="11" weight="500" color="secondary">%</Text>
					</div>
				</div>
			</div>
		</div>

		<!-- AI Insights -->
		<div v-if="aiInsights" :class="$style.insightsPanel">
			<div :class="$style.sectionHeader">
				<Text size="16" weight="700" color="primary">🤖 AI-POWERED INSIGHTS</Text>
			</div>

			<div :class="$style.insightsContent">
				<div :class="$style.assessmentBox">
					<Text size="13" weight="600" color="secondary">{{ aiInsights.overallAssessment }}</Text>
				</div>

				<div :class="$style.insightsGrid">
					<div :class="$style.strengthsBox">
						<Text size="13" weight="700" color="primary">💪 STRENGTHS</Text>
						<ul :class="$style.insightsList">
							<li v-for="(strength, index) in aiInsights.strengths" :key="index">
								<Text size="12" weight="500" color="secondary">{{ strength }}</Text>
							</li>
						</ul>
					</div>

					<div :class="$style.weaknessesBox">
						<Text size="13" weight="700" color="error">⚠️ AREAS TO IMPROVE</Text>
						<ul :class="$style.insightsList">
							<li v-for="(weakness, index) in aiInsights.weaknesses" :key="index">
								<Text size="12" weight="500" color="secondary">{{ weakness }}</Text>
							</li>
						</ul>
					</div>
				</div>

				<!-- Key Insights -->
				<div v-if="aiInsights.keyInsights" :class="$style.keyInsightsGrid">
					<div 
						v-for="(insight, index) in aiInsights.keyInsights" 
						:key="index"
						:class="$style.insightCard"
					>
						<div :class="$style.insightHeader">
							<Text size="11" weight="700" color="primary">{{ insight.area.toUpperCase() }}</Text>
						</div>
						<Text size="12" weight="500" color="secondary">{{ insight.insight }}</Text>
						<div :class="$style.recommendation">
							<Text size="11" weight="600" color="tertiary">💡 RECOMMENDATION</Text>
							<Text size="12" weight="500" color="secondary">{{ insight.recommendation }}</Text>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDriverInsightsStore } from '@/stores/driverInsights'
import { useRacingStore } from '@/stores/racing'
import { fetchTelemetryForLap } from '@/services/api/racing'

const driverInsightsStore = useDriverInsightsStore()
const racingStore = useRacingStore()

const {
	lap1Data,
	lap2Data,
	aiInsights,
	loading,
	analyzing,
	error,
	performanceMetrics
} = storeToRefs(driverInsightsStore)

const selectedLap1 = ref(null)
const selectedLap2 = ref(null)
const selectedVehicleId = ref(null)
const availableLaps = ref([])

// What-if scenario parameters
const speedImprovement = ref(0)
const brakingImprovement = ref(0)
const cornerExitImprovement = ref(0)
const lapTimeReduction = ref(0)
const scenarioResult = ref(null)

const vehicles = computed(() => racingStore.vehicles)

onMounted(async () => {
	if (racingStore.vehicles.length === 0) {
		await racingStore.loadInitialData()
	}

	if (racingStore.vehicles.length > 0) {
		selectedVehicleId.value = racingStore.vehicles[0].vehicleId
		availableLaps.value = Array.from({ length: 50 }, (_, i) => i + 1)
	}
})

const transformTelemetryData = (data) => {
	if (!Array.isArray(data)) return []

	const grouped = {}
	
	data.forEach(item => {
		const timestamp = item.timestamp
		if (!grouped[timestamp]) {
			grouped[timestamp] = {
				timestamp,
				lap: item.lap,
				vehicleId: item.vehicle_id
			}
		}

		const value = item.telemetry_value
		switch (item.telemetry_name) {
			case 'speed_can':
			case 'gps_speed':
				grouped[timestamp].speed = value
				break
			case 'eng_rpm':
			case 'rpm':
				grouped[timestamp].rpm = value
				break
			case 'ath':
			case 'throttle_pos':
				grouped[timestamp].throttle = value
				break
			case 'pbrake_f':
			case 'brake_pos':
				grouped[timestamp].brake = value
				break
			case 'Steering_Angle':
			case 'steering_angle':
				grouped[timestamp].steering = value
				break
			case 'gear':
				grouped[timestamp].gear = value
				break
		}
	})

	return Object.values(grouped).sort((a, b) => 
		new Date(a.timestamp) - new Date(b.timestamp)
	)
}

const onVehicleChange = () => {
	selectedLap1.value = null
	selectedLap2.value = null
	driverInsightsStore.reset()
	scenarioResult.value = null
}

const onLap1Change = async () => {
	if (!selectedLap1.value || !selectedVehicleId.value) return

	loading.value = true
	error.value = null

	try {
		const result = await fetchTelemetryForLap(selectedVehicleId.value, selectedLap1.value)
		const transformedData = transformTelemetryData(result.data || [])
		
		if (lap2Data.value.length > 0) {
			driverInsightsStore.setLapData(transformedData, lap2Data.value)
		} else {
			driverInsightsStore.setLapData(transformedData)
		}
	} catch (err) {
		error.value = `Failed to load lap ${selectedLap1.value}: ${err.message}`
	} finally {
		loading.value = false
	}
}

const onLap2Change = async () => {
	if (!selectedLap2.value || !selectedVehicleId.value) {
		driverInsightsStore.setLapData(lap1Data.value, [])
		return
	}

	loading.value = true
	error.value = null

	try {
		const result = await fetchTelemetryForLap(selectedVehicleId.value, selectedLap2.value)
		const transformedData = transformTelemetryData(result.data || [])
		driverInsightsStore.setLapData(lap1Data.value, transformedData)
	} catch (err) {
		error.value = `Failed to load lap ${selectedLap2.value}: ${err.message}`
	} finally {
		loading.value = false
	}
}

const runAnalysis = async () => {
	if (!selectedLap1.value) return
	await driverInsightsStore.analyzeLap(1)
}

const runScenarioSimulation = () => {
	// Simple simulation logic
	const currentPosition = Math.floor(Math.random() * 20) + 5 // Mock current position
	
	// Calculate improvement factor
	const improvementFactor = (
		(speedImprovement.value / 20) * 0.3 +
		(brakingImprovement.value / 30) * 0.25 +
		(cornerExitImprovement.value / 15) * 0.25 +
		(lapTimeReduction.value / 5) * 0.2
	)
	
	const positionsGained = Math.floor(improvementFactor * 10)
	const projectedPosition = Math.max(1, currentPosition - positionsGained)
	
	// Mock lap time calculation
	const baseLapTime = 148000 // 2:28.000 in ms
	const projectedLapTime = baseLapTime - (lapTimeReduction.value * 1000) - (improvementFactor * 2000)
	
	scenarioResult.value = {
		currentPosition,
		projectedPosition,
		positionChange: currentPosition - projectedPosition,
		projectedLapTime
	}
}

const formatLapTime = (ms) => {
	if (!ms) return 'N/A'
	const minutes = Math.floor(ms / 60000)
	const seconds = Math.floor((ms % 60000) / 1000)
	const milliseconds = ms % 1000
	return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}
</script>

<style module>
.driverInsightsView {
	padding: 0;
	max-width: 100%;
}

.header {
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 2px solid rgba(0, 255, 157, 0.2);
}

.headerContent {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.selectionPanel,
.whatIfPanel,
.metricsPanel,
.insightsPanel {
	background: rgba(0, 255, 157, 0.03);
	border: 2px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
}

.sectionHeader {
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid rgba(0, 255, 157, 0.1);
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.selectionGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 16px;
}

.selectBox {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.select {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.3);
	color: #00ff9d;
	padding: 12px;
	border-radius: 4px;
	font-family: 'Courier New', monospace;
	font-size: 13px;
	cursor: pointer;
	transition: all 0.2s;
}

.select:hover {
	border-color: #00ff9d;
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
}

.select:focus {
	outline: none;
	border-color: #00ff9d;
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.analyzeBtn,
.simulateBtn {
	width: 100%;
	background: rgba(0, 255, 157, 0.1);
	border: 2px solid #00ff9d;
	padding: 14px;
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s;
}

.analyzeBtn:hover:not(:disabled),
.simulateBtn:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.4);
	transform: translateY(-2px);
}

.analyzeBtn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.errorBox {
	background: rgba(255, 0, 100, 0.1);
	border: 2px solid rgba(255, 0, 100, 0.3);
	padding: 12px;
	border-radius: 4px;
	margin-bottom: 20px;
}

.scenarioGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 16px;
	margin-bottom: 20px;
}

.scenarioControl {
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(0, 255, 157, 0.2);
	padding: 16px;
	border-radius: 4px;
}

.controlHeader {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
}

.sliderContainer {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.slider {
	width: 100%;
	height: 4px;
	background: rgba(0, 255, 157, 0.2);
	outline: none;
	border-radius: 2px;
	-webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 16px;
	height: 16px;
	background: #00ff9d;
	cursor: pointer;
	border-radius: 50%;
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
}

.slider::-moz-range-thumb {
	width: 16px;
	height: 16px;
	background: #00ff9d;
	cursor: pointer;
	border-radius: 50%;
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
	border: none;
}

.scenarioResults {
	display: grid;
	grid-template-columns: 1fr auto 1fr 2fr;
	gap: 20px;
	align-items: center;
	margin-top: 20px;
	padding: 20px;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 4px;
}

.resultCard {
	text-align: center;
	padding: 20px;
	background: rgba(0, 255, 157, 0.05);
	border: 2px solid rgba(0, 255, 157, 0.3);
	border-radius: 4px;
}

.resultCard.improved {
	border-color: #00ff9d;
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
}

.resultArrow {
	display: flex;
	align-items: center;
	justify-content: center;
}

.resultDetails {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.metricsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 16px;
}

.metricCard {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 4px;
}

.metricContent {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.insightsContent {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

.assessmentBox {
	padding: 16px;
	background: rgba(0, 255, 157, 0.05);
	border-left: 4px solid #00ff9d;
	border-radius: 4px;
}

.insightsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
}

.strengthsBox,
.weaknessesBox {
	padding: 16px;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 4px;
}

.weaknessesBox {
	border-color: rgba(255, 0, 100, 0.3);
}

.insightsList {
	list-style: none;
	padding: 0;
	margin: 12px 0 0 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.insightsList li {
	padding: 8px;
	background: rgba(0, 255, 157, 0.05);
	border-left: 2px solid rgba(0, 255, 157, 0.5);
	border-radius: 2px;
}

.keyInsightsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 16px;
}

.insightCard {
	padding: 16px;
	background: rgba(0, 0, 0, 0.4);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 4px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.insightHeader {
	padding: 6px 12px;
	background: rgba(0, 255, 157, 0.1);
	border-radius: 2px;
	display: inline-block;
	align-self: flex-start;
}

.recommendation {
	padding: 12px;
	background: rgba(0, 255, 157, 0.05);
	border-radius: 4px;
	display: flex;
	flex-direction: column;
	gap: 6px;
}

@media (max-width: 768px) {
	.scenarioResults {
		grid-template-columns: 1fr;
		text-align: center;
	}
	
	.resultArrow {
		transform: rotate(90deg);
	}
}
</style>
