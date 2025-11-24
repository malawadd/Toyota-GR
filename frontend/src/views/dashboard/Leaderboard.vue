<script setup>
import { ref, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { fetchLeaderboard } from "@/services/api/racing"
import { formatLapTime, formatSpeed, formatCarNumber, getClassColor } from "@/services/formatters"

const router = useRouter()
const leaderboardData = ref([])
const loading = ref(true)
const selectedSort = ref('fastest_lap')
const selectedClass = ref(null)

const sortOptions = [
	{ value: 'fastest_lap', label: 'Fastest Lap' },
	{ value: 'average_lap', label: 'Average Lap' },
	{ value: 'max_speed', label: 'Max Speed' },
	{ value: 'position', label: 'Position' },
	{ value: 'total_laps', label: 'Total Laps' }
]

const loadLeaderboard = async () => {
	loading.value = true
	try {
		const params = {
			sortBy: selectedSort.value,
			order: 'asc'
		}
		if (selectedClass.value) {
			params.class = selectedClass.value
		}

		const result = await fetchLeaderboard(params)
		leaderboardData.value = result.data || []
	} catch (error) {
		console.error('Failed to load leaderboard:', error)
	} finally {
		loading.value = false
	}
}

const goToVehicle = (vehicleId) => {
	router.push({ name: 'vehicle-detail', params: { vehicleId } })
}

onMounted(loadLeaderboard)
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Flex align="center" justify="between" wrap>
				<Text size="24" weight="700" color="primary">LEADERBOARD</Text>

				<Flex align="center" gap="12" wrap>
					<Flex align="center" gap="8">
						<button
							:class="[$style.classButton, !selectedClass && $style.active]"
							@click="selectedClass = null; loadLeaderboard()"
						>
							<Text size="11" weight="700">ALL</Text>
						</button>
						<button
							:class="[$style.classButton, selectedClass === 'Pro' && $style.active]"
							@click="selectedClass = 'Pro'; loadLeaderboard()"
						>
							<Text size="11" weight="700" color="blue">PRO</Text>
						</button>
						<button
							:class="[$style.classButton, selectedClass === 'Am' && $style.active]"
							@click="selectedClass = 'Am'; loadLeaderboard()"
						>
							<Text size="11" weight="700" color="red">AM</Text>
						</button>
					</Flex>
				</Flex>
			</Flex>

			<Flex gap="12" wrap>
				<button
					v-for="option in sortOptions"
					:key="option.value"
					:class="[$style.sortButton, selectedSort === option.value && $style.activeSort]"
					@click="selectedSort = option.value; loadLeaderboard()"
				>
					<Text size="12" weight="700" :color="selectedSort === option.value ? 'green' : 'secondary'">
						{{ option.label.toUpperCase() }}
					</Text>
				</button>
			</Flex>

			<div v-if="loading" :class="$style.loadingCard">
				<div :class="$style.loadingSpinner" />
				<Text size="16" weight="600" color="tertiary">LOADING LEADERBOARD...</Text>
			</div>

			<div v-else :class="$style.leaderboardTable">
				<Flex
					v-for="(entry, index) in leaderboardData"
					:key="entry.vehicleId"
					align="center"
					gap="16"
					:class="$style.entryCard"
					@click="goToVehicle(entry.vehicleId)"
				>
					<div :class="[$style.rank, index < 3 && $style.topThree]">
						<Text size="18" weight="700" :color="index === 0 ? 'green' : index === 1 ? 'blue' : index === 2 ? 'yellow' : 'secondary'">
							{{ entry.rank }}
						</Text>
					</div>

					<Flex direction="column" gap="4" wide>
						<Flex align="center" gap="12">
							<Text size="16" weight="600" color="primary">
								{{ formatCarNumber(entry.carNumber) }}
							</Text>
							<div :class="$style.classBadge" :style="{ borderColor: getClassColor(entry.class) }">
								<Text size="10" weight="700" :style="{ color: getClassColor(entry.class) }">
									{{ entry.class }}
								</Text>
							</div>
							<Text size="12" weight="500" color="tertiary">{{ entry.vehicleId }}</Text>
						</Flex>
						<Flex align="center" gap="16">
							<Text size="13" weight="500" color="support">
								Fastest: {{ formatLapTime(entry.fastestLap) }}
							</Text>
							<Text size="13" weight="500" color="support">
								Max Speed: {{ formatSpeed(entry.maxSpeed) }}
							</Text>
							<Text size="13" weight="500" color="support">
								Laps: {{ entry.totalLaps }}
							</Text>
						</Flex>
					</Flex>

					<Flex direction="column" align="end" gap="4">
						<Text size="16" weight="700" color="primary" mono>
							{{ selectedSort === 'fastest_lap' || selectedSort === 'average_lap' ? formatLapTime(entry.value) :
							   selectedSort === 'max_speed' ? formatSpeed(entry.value) :
							   entry.value }}
						</Text>
						<Text size="11" weight="500" color="tertiary">{{ sortOptions.find(o => o.value === selectedSort)?.label }}</Text>
					</Flex>

					<Icon name="arrow-top-right" size="16" color="blue" />
				</Flex>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1200px;
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

.classButton {
	padding: 6px 12px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.classButton.active {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
	box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
}

.sortButton {
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	transition: all 0.2s ease;
	cursor: pointer;
}

.sortButton.activeSort {
	background: rgba(0, 255, 157, 0.1);
	border-color: var(--neon-lime);
}

.sortButton:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.2);
}

.leaderboardTable {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.entryCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 16px 20px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.entryCard:hover {
	background: rgba(0, 255, 157, 0.05);
	border-color: var(--neon-lime);
	transform: translateX(4px);
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.2);
}

.rank {
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	border: 2px solid var(--op-10);
}

.rank.topThree {
	background: rgba(0, 255, 157, 0.2);
	border-color: var(--neon-lime);
}

.classBadge {
	padding: 3px 8px;
	border-radius: 4px;
	border: 1px solid;
	background: rgba(0, 0, 0, 0.3);
}
</style>
