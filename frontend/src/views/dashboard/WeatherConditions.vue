<script setup>
import { ref, onMounted, computed } from "vue"
import { fetchWeather, fetchWeatherSummary } from "@/services/api/racing"
import { formatTemperature, formatPressure, formatWindSpeed, formatWindDirection } from "@/services/formatters"
import LineChart from "@/components/charts/LineChart.vue"
import GaugeChart from "@/components/charts/GaugeChart.vue"

const loading = ref(true)
const weatherSummary = ref(null)
const weatherTimeline = ref([])
const selectedMetric = ref('temperature')

const loadWeatherData = async () => {
	loading.value = true
	try {
		const [summary, timeline] = await Promise.all([
			fetchWeatherSummary(),
			fetchWeather({ limit: 100 })
		])

		weatherSummary.value = summary.data
		weatherTimeline.value = timeline.data || []
	} catch (error) {
		console.error('Failed to load weather data:', error)
	} finally {
		loading.value = false
	}
}

const temperatureData = computed(() => {
	return weatherTimeline.value.map((w, index) => ({
		x: index,
		air: w.air_temp,
		track: w.track_temp
	}))
})

const humidityData = computed(() => {
	return weatherTimeline.value.map((w, index) => ({
		x: index,
		y: w.humidity
	}))
})

const windData = computed(() => {
	const summary = weatherSummary.value
	return {
		speed: summary?.avgWindSpeed || 0,
		direction: summary?.avgWindDirection || 0
	}
})

onMounted(loadWeatherData)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">WEATHER CONDITIONS</Text>
					<Text size="14" weight="600" color="secondary">
						Track environmental monitoring and analysis
					</Text>
				</Flex>

				<button v-if="!loading" @click="loadWeatherData" :class="$style.refreshButton">
					<Icon name="zap-circle" size="16" color="green" />
					<Text size="12" weight="700" color="green">REFRESH</Text>
				</button>
			</Flex>

			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING WEATHER DATA...</Text>
			</div>

			<div v-else>
				<Flex direction="column" gap="24">
					<div :class="$style.statsGrid">
						<div :class="$style.statCard">
							<Flex direction="column" gap="8" align="center">
								<Icon name="zap" size="24" color="red" />
								<Text size="12" weight="600" color="tertiary">AIR TEMP</Text>
								<Text size="32" weight="700" color="primary" mono>
									{{ formatTemperature(weatherSummary?.avgAirTemp) }}
								</Text>
								<Flex gap="8">
									<Text size="11" weight="500" color="support">
										Min: {{ formatTemperature(weatherSummary?.minAirTemp) }}
									</Text>
									<Text size="11" weight="500" color="support">
										Max: {{ formatTemperature(weatherSummary?.maxAirTemp) }}
									</Text>
								</Flex>
							</Flex>
						</div>

						<div :class="$style.statCard">
							<Flex direction="column" gap="8" align="center">
								<Icon name="check-circle" size="24" color="yellow" />
								<Text size="12" weight="600" color="tertiary">TRACK TEMP</Text>
								<Text size="32" weight="700" color="primary" mono>
									{{ formatTemperature(weatherSummary?.avgTrackTemp) }}
								</Text>
								<Flex gap="8">
									<Text size="11" weight="500" color="support">
										Min: {{ formatTemperature(weatherSummary?.minTrackTemp) }}
									</Text>
									<Text size="11" weight="500" color="support">
										Max: {{ formatTemperature(weatherSummary?.maxTrackTemp) }}
									</Text>
								</Flex>
							</Flex>
						</div>

						<div :class="$style.statCard">
							<GaugeChart
								:value="weatherSummary?.avgHumidity || 0"
								:min="0"
								:max="100"
								label="HUMIDITY"
								unit="%"
								color="var(--neon-cyan)"
							/>
						</div>

						<div :class="$style.statCard">
							<Flex direction="column" gap="12" align="center">
								<Icon name="arrow-top-right" size="24" color="green" />
								<Text size="12" weight="600" color="tertiary">WIND</Text>
								<div :class="$style.windCompass">
									<div
										:class="$style.windArrow"
										:style="{ transform: `rotate(${windData.direction}deg)` }"
									>
										<div :class="$style.arrow" />
									</div>
									<Text size="16" weight="700" color="primary" mono>
										{{ formatWindSpeed(windData.speed) }}
									</Text>
									<Text size="11" weight="500" color="support">
										{{ formatWindDirection(windData.direction) }}
									</Text>
								</div>
							</Flex>
						</div>
					</div>

					<div :class="$style.chartsSection">
						<div :class="$style.chartCard">
							<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
								TEMPERATURE TIMELINE
							</Text>
							<Flex gap="12" style="margin-bottom: 16px;">
								<Flex align="center" gap="6">
									<div :class="$style.legendDot" style="background: var(--neon-cyan);" />
									<Text size="12" weight="500" color="tertiary">Air Temp</Text>
								</Flex>
								<Flex align="center" gap="6">
									<div :class="$style.legendDot" style="background: var(--red);" />
									<Text size="12" weight="500" color="tertiary">Track Temp</Text>
								</Flex>
							</Flex>
							<div v-if="temperatureData.length" :class="$style.chartWrapper">
								<LineChart
									:data="temperatureData.map(d => ({ x: d.x, y: d.air }))"
									xKey="x"
									yKey="y"
									color="var(--neon-cyan)"
									:height="300"
									xLabel="Time"
									yLabel="Temperature (°C)"
								/>
							</div>
							<Text v-else size="14" weight="500" color="support" align="center" style="padding: 40px;">
								No temperature data available
							</Text>
						</div>

						<div :class="$style.chartCard">
							<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
								HUMIDITY LEVELS
							</Text>
							<div v-if="humidityData.length" :class="$style.chartWrapper">
								<LineChart
									:data="humidityData"
									xKey="x"
									yKey="y"
									color="var(--electric-blue)"
									:height="300"
									xLabel="Time"
									yLabel="Humidity (%)"
								/>
							</div>
							<Text v-else size="14" weight="500" color="support" align="center" style="padding: 40px;">
								No humidity data available
							</Text>
						</div>
					</div>

					<div :class="$style.summaryCard">
						<Flex direction="column" gap="12">
							<Text size="16" weight="700" color="primary">WEATHER SUMMARY</Text>
							<Flex gap="24" wrap>
								<Flex direction="column" gap="4">
									<Text size="12" weight="600" color="tertiary">Pressure</Text>
									<Text size="14" weight="600" color="secondary" mono>
										{{ formatPressure(weatherSummary?.avgPressure) }}
									</Text>
								</Flex>
								<Flex direction="column" gap="4">
									<Text size="12" weight="600" color="tertiary">Total Rain</Text>
									<Text size="14" weight="600" color="secondary" mono>
										{{ weatherSummary?.totalRain || 0 }} mm
									</Text>
								</Flex>
								<Flex direction="column" gap="4">
									<Text size="12" weight="600" color="tertiary">Data Points</Text>
									<Text size="14" weight="600" color="secondary" mono>
										{{ weatherSummary?.recordCount || 0 }}
									</Text>
								</Flex>
							</Flex>
						</Flex>
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

.refreshButton {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 6px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.refreshButton:hover {
	background: rgba(0, 255, 157, 0.2);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.statsGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.statCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
	transition: all 0.3s ease;
}

.statCard:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
}

.windCompass {
	position: relative;
	width: 120px;
	height: 120px;
	border: 2px solid var(--op-10);
	border-radius: 50%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	background: rgba(0, 0, 0, 0.4);
}

.windArrow {
	position: absolute;
	width: 100%;
	height: 100%;
	transition: transform 0.5s ease;
}

.arrow {
	position: absolute;
	top: 10px;
	left: 50%;
	transform: translateX(-50%);
	width: 0;
	height: 0;
	border-left: 8px solid transparent;
	border-right: 8px solid transparent;
	border-bottom: 20px solid var(--neon-lime);
	filter: drop-shadow(0 0 6px var(--neon-lime));
}

.chartsSection {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
	gap: 24px;
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

.legendDot {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	box-shadow: 0 0 8px currentColor;
}

.summaryCard {
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	padding: 20px;
}

@media (max-width: 1024px) {
	.chartsSection {
		grid-template-columns: 1fr;
	}
}
</style>
