<script setup>
import { ref, onMounted } from "vue"
import { fetchSectionLeaders, fetchSectionTimes } from "@/services/api/racing"
import { formatSectionTime, formatCarNumber } from "@/services/formatters"
import BarChart from "@/components/charts/BarChart.vue"

const loading = ref(true)
const sectionLeaders = ref(null)
const sectionData = ref([])
const selectedSection = ref('s1')

const loadSectionData = async () => {
	loading.value = true
	try {
		const [leaders, times] = await Promise.all([
			fetchSectionLeaders(),
			fetchSectionTimes({ section: selectedSection.value, limit: 10 })
		])

		sectionLeaders.value = leaders.data
		sectionData.value = times.data || []
	} catch (error) {
		console.error('Failed to load section data:', error)
	} finally {
		loading.value = false
	}
}

const selectSection = (section) => {
	selectedSection.value = section
	loadSectionData()
}

onMounted(loadSectionData)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between">
				<Flex direction="column" gap="8">
					<Text size="24" weight="700" color="primary">SECTION TIMES</Text>
					<Text size="14" weight="600" color="secondary">
						Sector-by-sector performance analysis
					</Text>
				</Flex>

				<Flex align="center" gap="8">
					<button
						:class="[$style.sectionButton, selectedSection === 's1' && $style.active]"
						@click="selectSection('s1')"
					>
						<Text size="12" weight="700" :color="selectedSection === 's1' ? 'green' : 'secondary'">S1</Text>
					</button>
					<button
						:class="[$style.sectionButton, selectedSection === 's2' && $style.active]"
						@click="selectSection('s2')"
					>
						<Text size="12" weight="700" :color="selectedSection === 's2' ? 'green' : 'secondary'">S2</Text>
					</button>
					<button
						:class="[$style.sectionButton, selectedSection === 's3' && $style.active]"
						@click="selectSection('s3')"
					>
						<Text size="12" weight="700" :color="selectedSection === 's3' ? 'green' : 'secondary'">S3</Text>
					</button>
				</Flex>
			</Flex>

			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING SECTION DATA...</Text>
			</div>

			<div v-else>
				<Flex direction="column" gap="24">
					<div :class="$style.leadersGrid">
						<div :class="$style.leaderCard">
							<Flex direction="column" gap="8" align="center">
								<Icon name="check-circle" size="24" color="green" />
								<Text size="12" weight="600" color="tertiary">SECTOR 1 LEADER</Text>
								<Text size="28" weight="700" color="primary" mono>
									{{ sectionLeaders?.s1?.vehicle_id ? formatCarNumber(sectionLeaders.s1.vehicle_id.split('-')[2]) : '--' }}
								</Text>
								<Text size="14" weight="600" color="secondary" mono>
									{{ sectionLeaders?.s1?.time ? formatSectionTime(sectionLeaders.s1.time) : '--' }}
								</Text>
							</Flex>
						</div>

						<div :class="$style.leaderCard">
							<Flex direction="column" gap="8" align="center">
								<Icon name="check-circle" size="24" color="blue" />
								<Text size="12" weight="600" color="tertiary">SECTOR 2 LEADER</Text>
								<Text size="28" weight="700" color="primary" mono>
									{{ sectionLeaders?.s2?.vehicle_id ? formatCarNumber(sectionLeaders.s2.vehicle_id.split('-')[2]) : '--' }}
								</Text>
								<Text size="14" weight="600" color="secondary" mono>
									{{ sectionLeaders?.s2?.time ? formatSectionTime(sectionLeaders.s2.time) : '--' }}
								</Text>
							</Flex>
						</div>

						<div :class="$style.leaderCard">
							<Flex direction="column" gap="8" align="center">
								<Icon name="check-circle" size="24" color="yellow" />
								<Text size="12" weight="600" color="tertiary">SECTOR 3 LEADER</Text>
								<Text size="28" weight="700" color="primary" mono>
									{{ sectionLeaders?.s3?.vehicle_id ? formatCarNumber(sectionLeaders.s3.vehicle_id.split('-')[2]) : '--' }}
								</Text>
								<Text size="14" weight="600" color="secondary" mono>
									{{ sectionLeaders?.s3?.time ? formatSectionTime(sectionLeaders.s3.time) : '--' }}
								</Text>
							</Flex>
						</div>
					</div>

					<div :class="$style.tableCard">
						<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
							TOP 10 FASTEST {{ selectedSection.toUpperCase() }} TIMES
						</Text>
						<Flex direction="column" gap="8">
							<Flex
								v-for="(entry, index) in sectionData"
								:key="entry.id"
								align="center"
								gap="16"
								:class="$style.entryRow"
							>
								<div :class="[$style.rank, index === 0 && $style.firstPlace]">
									<Text size="16" weight="700" :color="index === 0 ? 'green' : 'secondary'">
										{{ index + 1 }}
									</Text>
								</div>
								<Flex direction="column" gap="4" wide>
									<Text size="14" weight="600" color="primary">
										{{ formatCarNumber(entry.vehicle_id?.split('-')[2]) }}
									</Text>
									<Text size="11" weight="500" color="tertiary">
										Lap {{ entry.lap }}
									</Text>
								</Flex>
								<Text size="14" weight="700" color="secondary" mono>
									{{ formatSectionTime(entry[selectedSection]) }}
								</Text>
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

.sectionButton {
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	min-width: 60px;
}

.sectionButton.active {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}

.sectionButton:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.2);
}

.leadersGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 20px;
}

.leaderCard {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
	transition: all 0.3s ease;
}

.leaderCard:hover {
	transform: translateY(-4px);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
}

.tableCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 20px;
}

.entryRow {
	background: rgba(0, 0, 0, 0.4);
	padding: 12px 16px;
	border-radius: 6px;
	border: 1px solid var(--op-10);
	transition: all 0.3s ease;
}

.entryRow:hover {
	background: rgba(0, 255, 157, 0.05);
	border-color: var(--neon-lime);
}

.rank {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	border: 2px solid var(--op-10);
}

.rank.firstPlace {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
	box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
}
</style>
