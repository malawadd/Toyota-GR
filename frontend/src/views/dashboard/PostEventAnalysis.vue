<template>
	<div class="post-event-analysis">
		<!-- Loading State -->
		<div v-if="store.loading" class="loading-container">
			<div class="loading-spinner"></div>
			<Text size="16" weight="600" color="tertiary">LOADING RACE DATA...</Text>
		</div>

		<!-- Error State -->
		<div v-else-if="store.error" class="error-container">
			<Icon name="alert-circle" size="32" color="red" />
			<Text size="18" weight="700" color="primary">FAILED TO LOAD RACE DATA</Text>
			<Text size="14" weight="500" color="secondary">{{ store.error }}</Text>
			<button @click="store.loadAndAnalyze()" class="retry-btn">
				<Icon name="refresh-cw" size="16" color="green" />
				<Text size="12" weight="700" color="green">RETRY</Text>
			</button>
		</div>

		<!-- Main Content -->
		<div v-else class="analysis-content">
			<Flex direction="column" gap="24">
				<!-- Header -->
				<Flex align="center" justify="between">
					<Flex direction="column" gap="8">
						<Text size="24" weight="700" color="primary">POST-EVENT ANALYSIS</Text>
						<Text size="14" weight="600" color="secondary">
							AI-Powered Race Story & Strategic Insights
						</Text>
					</Flex>
				</Flex>

				<!-- Race Narrative -->
				<div class="narrative-card">
					<div v-if="store.loadingNarrative" class="narrative-loading">
						<div class="typing-indicator">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<Text size="14" weight="600" color="tertiary">GENERATING RACE NARRATIVE...</Text>
					</div>
					<div v-else-if="store.raceNarrative" class="narrative-content">
						<Flex align="flex-start" gap="16">
							<Icon name="book-open" size="24" color="green" />
							<Flex direction="column" gap="12">
								<Text size="16" weight="700" color="primary">RACE STORY</Text>
								<Text size="14" weight="500" color="secondary" style="line-height: 1.6;">
									{{ store.raceNarrative }}
								</Text>
							</Flex>
						</Flex>
					</div>
				</div>

				<!-- Race Statistics Overview -->
				<div v-if="store.raceStatistics" class="stats-grid">
					<div class="stat-card">
						<Flex direction="column" gap="8" align="center">
							<Icon name="users" size="24" color="green" />
							<Text size="12" weight="600" color="tertiary">VEHICLES</Text>
							<Text size="32" weight="700" color="primary" mono>
								{{ store.raceStatistics.totalVehicles }}
							</Text>
						</Flex>
					</div>
					<div class="stat-card">
						<Flex direction="column" gap="8" align="center">
							<Icon name="flag" size="24" color="yellow" />
							<Text size="12" weight="600" color="tertiary">TOTAL LAPS</Text>
							<Text size="32" weight="700" color="primary" mono>
								{{ store.raceStatistics.totalLaps }}
							</Text>
						</Flex>
					</div>
					<div class="stat-card">
						<Flex direction="column" gap="8" align="center">
							<Icon name="zap" size="24" color="red" />
							<Text size="12" weight="600" color="tertiary">FASTEST LAP</Text>
							<Text size="24" weight="700" color="primary" mono>
								{{ formatTime(store.raceStatistics.fastestLap) }}
							</Text>
						</Flex>
					</div>
					<div class="stat-card winner-card">
						<Flex direction="column" gap="8" align="center">
							<Icon name="trophy" size="24" color="green" />
							<Text size="12" weight="600" color="tertiary">WINNER</Text>
							<Text size="32" weight="700" color="green" mono>
								#{{ store.raceStatistics.winner?.car_number }}
							</Text>
						</Flex>
					</div>
				</div>

				<!-- Performance Highlights -->
				<div v-if="store.performanceHighlights.length > 0" class="section-card">
					<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
						PERFORMANCE HIGHLIGHTS
					</Text>
					<div class="highlights-grid">
						<div
							v-for="(highlight, index) in store.performanceHighlights"
							:key="index"
							class="highlight-card"
						>
							<Flex direction="column" gap="12">
								<Flex align="center" gap="12">
									<Icon :name="getHighlightIcon(highlight.type)" size="20" color="green" />
									<Text size="13" weight="700" color="tertiary">{{ highlight.title }}</Text>
								</Flex>
								<Text size="13" weight="500" color="secondary">
									{{ highlight.description }}
								</Text>
								<Text v-if="highlight.carNumber" size="12" weight="600" color="green">
									CAR #{{ highlight.carNumber }}
								</Text>
							</Flex>
						</div>
					</div>
				</div>

				<!-- Key Moments Timeline -->
				<div v-if="store.keyMoments.length > 0" class="section-card">
					<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
						KEY MOMENTS
					</Text>
					
					<div v-if="store.loadingMoments" class="loading-section">
						<div class="loading-spinner small"></div>
						<Text size="14" weight="600" color="tertiary">ANALYZING KEY MOMENTS...</Text>
					</div>
					
					<RaceTimeline
						v-else
						:moments="store.keyMoments"
						@select-moment="selectedMoment = $event"
					/>
				</div>

				<!-- Strategic Insights -->
				<div v-if="store.strategicInsights.length > 0" class="section-card">
					<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
						STRATEGIC INSIGHTS
					</Text>

					<div v-if="store.loadingInsights" class="loading-section">
						<div class="loading-spinner small"></div>
						<Text size="14" weight="600" color="tertiary">GENERATING STRATEGIC INSIGHTS...</Text>
					</div>

					<div v-else class="insights-grid">
						<InsightPanel
							v-for="(insight, index) in store.strategicInsights"
							:key="index"
							:insight="insight"
						/>
					</div>
				</div>

				<!-- Top Finishers -->
				<div v-if="store.topFinishers.length > 0" class="section-card">
					<Text size="18" weight="700" color="primary" style="margin-bottom: 16px;">
						TOP FINISHERS
					</Text>
					<div class="finishers-list">
						<div
							v-for="(result, index) in store.topFinishers"
							:key="result.vehicle_id"
							class="finisher-card"
							:class="`position-${index + 1}`"
						>
							<div class="position-badge">{{ index + 1 }}</div>
							<Flex direction="column" gap="4" style="flex: 1;">
								<Text size="16" weight="700" color="primary">CAR #{{ result.car_number }}</Text>
								<Flex gap="12">
									<div class="class-badge">
										<Text size="10" weight="700" color="green">{{ result.class }}</Text>
									</div>
									<Text size="12" weight="500" color="support">{{ result.laps }} laps</Text>
								</Flex>
							</Flex>
							<Flex direction="column" gap="4" align="flex-end">
								<Text size="11" weight="500" color="support">Best Lap</Text>
								<Text size="14" weight="700" color="green" mono>
									{{ formatTime(result.best_lap_time) }}
								</Text>
							</Flex>
						</div>
					</div>
				</div>

				<!-- Generate Analysis Button -->
				<div v-if="!store.analysisGenerated && !store.loading" class="generate-section">
					<button @click="store.generateAnalysis()" class="generate-btn">
						<Icon name="cpu" size="16" color="green" />
						<Text size="13" weight="700" color="green">GENERATE AI ANALYSIS</Text>
					</button>
				</div>
			</Flex>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePostEventAnalysisStore } from '@/stores/postEventAnalysis'
import Icon from '@/components/Icon.vue'
import RaceTimeline from '@/components/RaceTimeline.vue'
import InsightPanel from '@/components/InsightPanel.vue'

const store = usePostEventAnalysisStore()
const selectedMoment = ref(null)

onMounted(async () => {
	await store.loadAndAnalyze()
})

function formatTime(ms) {
	if (!ms || ms === 0) return 'N/A'
	const minutes = Math.floor(ms / 60000)
	const seconds = Math.floor((ms % 60000) / 1000)
	const millis = ms % 1000
	return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

function getHighlightIcon(type) {
	const icons = {
		race_winner: 'trophy',
		fastest_lap: 'zap',
		section_master: 'target',
		consistency: 'activity'
	}
	return icons[type] || 'star'
}
</script>

<style scoped lang="scss">
.post-event-analysis {
	max-width: 1400px;
}

.loading-container,
.error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	gap: 16px;
	padding: 48px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 157, 0.2);
	border-radius: 8px;
}

.loading-spinner {
	width: 48px;
	height: 48px;
	border: 4px solid rgba(0, 255, 157, 0.2);
	border-top-color: #00ff9d;
	border-radius: 50%;
	animation: spin 1s linear infinite;

	&.small {
		width: 32px;
		height: 32px;
		border-width: 3px;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.retry-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(0, 255, 157, 0.2);
		box-shadow: 0 0 15px rgba(0, 255, 157, 0.3);
	}
}

.analysis-content {
	width: 100%;
}

.narrative-card {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 24px;
}

.narrative-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 24px;
}

.typing-indicator {
	display: flex;
	gap: 8px;

	span {
		width: 8px;
		height: 8px;
		background: #00ff9d;
		border-radius: 50%;
		animation: typing 1.4s infinite;

		&:nth-child(2) {
			animation-delay: 0.2s;
		}

		&:nth-child(3) {
			animation-delay: 0.4s;
		}
	}
}

@keyframes typing {
	0%, 60%, 100% {
		transform: translateY(0);
		opacity: 0.5;
	}
	30% {
		transform: translateY(-10px);
		opacity: 1;
	}
}

.narrative-content {
	width: 100%;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 20px;
}

.stat-card {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 8px;
	padding: 24px;
	transition: all 0.3s ease;

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
	}

	&.winner-card {
		border-color: rgba(0, 255, 157, 0.5);
		background: rgba(0, 255, 157, 0.05);
	}
}

.section-card {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 24px;
}

.highlights-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	gap: 16px;
}

.highlight-card {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(0, 255, 157, 0.3);
		box-shadow: 0 0 20px rgba(0, 255, 157, 0.15);
	}
}

.loading-section {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px;
}

.insights-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
	gap: 16px;
}

.finishers-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.finisher-card {
	display: flex;
	align-items: center;
	gap: 16px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(0, 255, 157, 0.3);
		transform: translateX(4px);
	}

	&.position-1 {
		border-color: rgba(0, 255, 157, 0.5);
		background: rgba(0, 255, 157, 0.05);
	}
}

.position-badge {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: rgba(0, 255, 157, 0.2);
	border: 2px solid #00ff9d;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	font-weight: 700;
	color: #00ff9d;
	flex-shrink: 0;
}

.class-badge {
	padding: 2px 8px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 3px;
}

.generate-section {
	display: flex;
	justify-content: center;
	padding: 24px 0;
}

.generate-btn {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 24px;
	background: rgba(0, 255, 157, 0.1);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(0, 255, 157, 0.2);
		box-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
	}
}
</style>
