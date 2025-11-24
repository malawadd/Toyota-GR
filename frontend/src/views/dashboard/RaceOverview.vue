<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useRacingStore } from "@/stores/racing"
import { formatLapTime, formatSpeed, formatCarNumber, getClassColor } from "@/services/formatters"

const racingStore = useRacingStore()
const router = useRouter()
const loading = ref(true)

onMounted(async () => {
	await racingStore.loadInitialData()
	loading.value = false
})

const goToVehicle = (vehicleId) => {
	router.push({ name: 'vehicle-detail', params: { vehicleId } })
}

const goToLeaderboard = () => {
	router.push({ name: 'leaderboard' })
}
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">RACE OVERVIEW</Text>
					<Text size="14" weight="600" color="secondary">
						Toyota GR Cup Series - Live Dashboard
					</Text>
				</Flex>

				<button v-if="!loading" @click="racingStore.refreshData" :class="$style.refreshButton">
					<Icon name="zap-circle" size="16" color="green" />
					<Text size="12" weight="700" color="green">REFRESH</Text>
				</button>
			</Flex>

			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING RACE DATA...</Text>
			</div>

			<div v-else>
				<Flex direction="column" gap="24">
					<div :class="$style.statsGrid">
						<div :class="$style.statCard">
							<Icon name="zap-circle" size="24" color="green" />
							<Text size="32" weight="700" color="primary" mono>
								{{ racingStore.statistics?.totalVehicles || 0 }}
							</Text>
							<Text size="12" weight="600" color="tertiary">ACTIVE VEHICLES</Text>
						</div>

						<div :class="$style.statCard">
							<Icon name="check-circle" size="24" color="blue" />
							<Text size="32" weight="700" color="primary" mono>
								{{ racingStore.statistics?.totalLaps || 0 }}
							</Text>
							<Text size="12" weight="600" color="tertiary">TOTAL LAPS</Text>
						</div>

						<div :class="$style.statCard">
							<Icon name="zap" size="24" color="red" />
							<Text size="24" weight="700" color="primary" mono>
								{{ racingStore.statistics?.fastestLap ? formatLapTime(racingStore.statistics.fastestLap) : '--:--.---' }}
							</Text>
							<Text size="12" weight="600" color="tertiary">FASTEST LAP</Text>
						</div>

						<div :class="$style.statCard">
							<Icon name="arrow-top-right" size="24" color="yellow" />
							<Text size="28" weight="700" color="primary" mono>
								{{ racingStore.statistics?.maxSpeed ? formatSpeed(racingStore.statistics.maxSpeed) : '--' }}
							</Text>
							<Text size="12" weight="600" color="tertiary">TOP SPEED</Text>
						</div>
					</div>

					<Flex gap="24" :class="$style.contentGrid">
						<div :class="$style.section">
							<Flex align="center" justify="between" style="margin-bottom: 16px;">
								<Text size="18" weight="700" color="primary">TOP 10 FASTEST LAPS</Text>
								<button @click="goToLeaderboard" :class="$style.viewAllButton">
									<Text size="11" weight="700" color="blue">VIEW ALL</Text>
									<Icon name="arrow-top-right" size="12" color="blue" />
								</button>
							</Flex>
							<Flex direction="column" gap="8">
								<Flex
									v-for="(lap, index) in racingStore.fastestLaps"
									:key="lap.id"
									align="center"
									gap="12"
									:class="$style.lapCard"
									@click="goToVehicle(lap.vehicle_id)"
								>
									<div :class="[$style.position, index === 0 && $style.first]">
										<Text size="14" weight="700" :color="index === 0 ? 'green' : 'secondary'">
											{{ index + 1 }}
										</Text>
									</div>
									<Flex direction="column" gap="4" wide>
										<Flex align="center" gap="8">
											<Text size="14" weight="600" color="primary">
												{{ formatCarNumber(lap.vehicle_id?.split('-')[2]) }}
											</Text>
											<Text size="11" weight="500" color="tertiary">{{ lap.vehicle_id }}</Text>
										</Flex>
										<Text size="13" weight="600" color="secondary" mono>
											LAP {{ lap.lap }}: {{ formatLapTime(lap.lap_time) }}
										</Text>
									</Flex>
									<Icon name="arrow-top-right" size="14" color="blue" />
								</Flex>
							</Flex>
						</div>

						<div :class="$style.section">
							<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">SECTOR LEADERS</Text>
							<Flex direction="column" gap="12">
								<div :class="$style.sectorCard">
									<Flex align="center" justify="between">
										<Text size="14" weight="700" color="tertiary">SECTOR 1</Text>
										<Icon name="check-circle" size="16" color="green" />
									</Flex>
									<Flex align="center" justify="between" style="margin-top: 8px;">
										<Text size="16" weight="600" color="primary">
											{{ racingStore.sectionLeaders?.s1?.vehicle_id ? formatCarNumber(racingStore.sectionLeaders.s1.vehicle_id.split('-')[2]) : '--' }}
										</Text>
										<Text size="14" weight="600" color="secondary" mono>
											{{ racingStore.sectionLeaders?.s1?.time ? `${racingStore.sectionLeaders.s1.time.toFixed(3)}s` : '--' }}
										</Text>
									</Flex>
								</div>

								<div :class="$style.sectorCard">
									<Flex align="center" justify="between">
										<Text size="14" weight="700" color="tertiary">SECTOR 2</Text>
										<Icon name="check-circle" size="16" color="blue" />
									</Flex>
									<Flex align="center" justify="between" style="margin-top: 8px;">
										<Text size="16" weight="600" color="primary">
											{{ racingStore.sectionLeaders?.s2?.vehicle_id ? formatCarNumber(racingStore.sectionLeaders.s2.vehicle_id.split('-')[2]) : '--' }}
										</Text>
										<Text size="14" weight="600" color="secondary" mono>
											{{ racingStore.sectionLeaders?.s2?.time ? `${racingStore.sectionLeaders.s2.time.toFixed(3)}s` : '--' }}
										</Text>
									</Flex>
								</div>

								<div :class="$style.sectorCard">
									<Flex align="center" justify="between">
										<Text size="14" weight="700" color="tertiary">SECTOR 3</Text>
										<Icon name="check-circle" size="16" color="yellow" />
									</Flex>
									<Flex align="center" justify="between" style="margin-top: 8px;">
										<Text size="16" weight="600" color="primary">
											{{ racingStore.sectionLeaders?.s3?.vehicle_id ? formatCarNumber(racingStore.sectionLeaders.s3.vehicle_id.split('-')[2]) : '--' }}
										</Text>
										<Text size="14" weight="600" color="secondary" mono>
											{{ racingStore.sectionLeaders?.s3?.time ? `${racingStore.sectionLeaders.s3.time.toFixed(3)}s` : '--' }}
										</Text>
									</Flex>
								</div>
							</Flex>
						</div>
					</Flex>

					<div :class="$style.infoCard">
						<Icon name="zap-circle" size="20" color="green" />
						<Text size="12" weight="500" color="support">
							Race data updates automatically. Click on any vehicle to view detailed telemetry and performance metrics.
						</Text>
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
}

.statCard:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
}

.contentGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 24px;
}

.section {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 20px;
}

.lapCard {
	background: rgba(0, 0, 0, 0.4);
	padding: 12px;
	border-radius: 6px;
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
	width: 30px;
	height: 30px;
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

.sectorCard {
	background: rgba(0, 0, 0, 0.4);
	padding: 16px;
	border-radius: 6px;
	border: 1px solid var(--op-10);
	transition: all 0.3s ease;
}

.sectorCard:hover {
	background: rgba(0, 255, 157, 0.05);
	border-color: var(--neon-lime);
}

.viewAllButton {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 10px;
	background: rgba(0, 170, 255, 0.1);
	border: 1px solid rgba(0, 170, 255, 0.3);
	border-radius: 4px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.viewAllButton:hover {
	background: rgba(0, 170, 255, 0.2);
	box-shadow: 0 0 10px rgba(0, 170, 255, 0.3);
}

.infoCard {
	background: rgba(255, 255, 255, 0.02);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 6px;
	padding: 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

@media (max-width: 1024px) {
	.contentGrid {
		grid-template-columns: 1fr;
	}
}
</style>
