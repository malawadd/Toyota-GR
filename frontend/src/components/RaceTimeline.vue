<template>
	<div class="race-timeline">
		<Flex direction="column" gap="16">
			<Flex gap="8" wrap class="timeline-filters">
				<button
					v-for="type in eventTypes"
					:key="type.value"
					@click="toggleFilter(type.value)"
					:class="['filter-btn', { active: activeFilters.includes(type.value) }]"
				>
					<Icon :name="type.icon" size="14" :color="activeFilters.includes(type.value) ? 'green' : 'support'" />
					<Text size="11" weight="700" :color="activeFilters.includes(type.value) ? 'green' : 'support'">
						{{ type.label }}
					</Text>
				</button>
			</Flex>

			<div class="timeline-container">
				<div class="timeline-line"></div>
				
				<div
					v-for="(moment, index) in filteredMoments"
					:key="index"
					class="timeline-item"
					:class="`impact-${moment.impact}`"
					@click="selectMoment(moment)"
				>
					<div class="timeline-marker">
						<Icon :name="getTypeIcon(moment.type)" size="14" />
					</div>
					
					<div class="timeline-content">
						<Flex direction="column" gap="6">
							<Flex gap="12">
								<Text v-if="moment.lap" size="11" weight="700" color="green">LAP {{ moment.lap }}</Text>
								<Text v-if="moment.timestamp" size="10" weight="500" color="support">
									{{ formatTimestamp(moment.timestamp) }}
								</Text>
							</Flex>
							<Text size="13" weight="600" color="primary">
								{{ moment.enhancedDescription || moment.description }}
							</Text>
							<Text v-if="moment.carNumber" size="11" weight="500" color="secondary">
								Car #{{ moment.carNumber }}
							</Text>
						</Flex>
					</div>
				</div>

				<div v-if="filteredMoments.length === 0" class="no-moments">
					<Icon name="info" size="24" color="support" />
					<Text size="13" weight="500" color="support">No moments match the selected filters</Text>
				</div>
			</div>
		</Flex>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from '@/components/Icon.vue'

const props = defineProps({
	moments: {
		type: Array,
		default: () => []
	}
})

const emit = defineEmits(['select-moment'])

const eventTypes = [
	{ value: 'fastest_lap', label: 'FASTEST', icon: 'zap' },
	{ value: 'section_leader', label: 'SECTION', icon: 'target' },
	{ value: 'weather_change', label: 'WEATHER', icon: 'cloud-rain' },
	{ value: 'close_battle', label: 'BATTLE', icon: 'users' }
]

const activeFilters = ref([])

const filteredMoments = computed(() => {
	if (activeFilters.value.length === 0) {
		return props.moments
	}
	return props.moments.filter(m => activeFilters.value.includes(m.type))
})

function toggleFilter(type) {
	const index = activeFilters.value.indexOf(type)
	if (index > -1) {
		activeFilters.value.splice(index, 1)
	} else {
		activeFilters.value.push(type)
	}
}

function selectMoment(moment) {
	emit('select-moment', moment)
}

function getTypeIcon(type) {
	const icons = {
		fastest_lap: 'zap',
		section_leader: 'target',
		weather_change: 'cloud-rain',
		close_battle: 'users',
		position_change: 'trending-up'
	}
	return icons[type] || 'star'
}

function formatTimestamp(timestamp) {
	if (!timestamp) return ''
	const date = new Date(timestamp)
	return date.toLocaleTimeString('en-US', { 
		hour: '2-digit', 
		minute: '2-digit',
		second: '2-digit'
	})
}
</script>

<style scoped lang="scss">
.race-timeline {
	width: 100%;
}

.timeline-filters {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.filter-btn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}

	&.active {
		background: rgba(0, 255, 157, 0.1);
		border-color: var(--neon-lime);
		box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
	}
}

.timeline-container {
	position: relative;
	padding-left: 32px;
}

.timeline-line {
	position: absolute;
	left: 12px;
	top: 0;
	bottom: 0;
	width: 2px;
	background: rgba(0, 255, 157, 0.3);
}

.timeline-item {
	position: relative;
	margin-bottom: 16px;
	cursor: pointer;
	transition: all 0.3s ease;

	&:hover {
		transform: translateX(4px);

		.timeline-marker {
			transform: scale(1.1);
			box-shadow: 0 0 15px currentColor;
		}
	}

	&.impact-high .timeline-marker {
		color: var(--red);
		background: rgba(255, 71, 87, 0.1);
		border-color: var(--red);
	}

	&.impact-medium .timeline-marker {
		color: var(--yellow);
		background: rgba(255, 193, 7, 0.1);
		border-color: var(--yellow);
	}

	&.impact-low .timeline-marker {
		color: var(--neon-lime);
		background: rgba(0, 255, 157, 0.1);
		border-color: var(--neon-lime);
	}
}

.timeline-marker {
	position: absolute;
	left: -26px;
	top: 4px;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 255, 157, 0.1);
	border: 2px solid var(--neon-lime);
	color: var(--neon-lime);
	transition: all 0.3s ease;
	z-index: 2;
}

.timeline-content {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 12px;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(0, 255, 157, 0.3);
	}
}

.no-moments {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 40px 16px;
	text-align: center;
}
</style>
