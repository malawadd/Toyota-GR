<template>
	<div class="moment-card" :class="`impact-${moment.impact}`">
		<Flex direction="column" gap="12">
			<Flex align="center" justify="between">
				<Flex align="center" gap="8">
					<Icon :name="getTypeIcon(moment.type)" size="16" :color="getImpactColor(moment.impact)" />
					<Text size="11" weight="700" color="tertiary">{{ getTypeLabel(moment.type) }}</Text>
				</Flex>
				<div class="moment-impact" :class="`impact-${moment.impact}`">
					<Text size="9" weight="700">{{ moment.impact }}</Text>
				</div>
			</Flex>

			<Text size="13" weight="600" color="primary">
				{{ moment.enhancedDescription || moment.description }}
			</Text>

			<Flex gap="12" wrap>
				<Flex v-if="moment.lap" align="center" gap="4">
					<Icon name="flag" size="12" color="support" />
					<Text size="11" weight="500" color="support">Lap {{ moment.lap }}</Text>
				</Flex>
				<Flex v-if="moment.carNumber" align="center" gap="4">
					<Icon name="hash" size="12" color="support" />
					<Text size="11" weight="500" color="support">Car {{ moment.carNumber }}</Text>
				</Flex>
				<Flex v-if="moment.time" align="center" gap="4">
					<Icon name="clock" size="12" color="support" />
					<Text size="11" weight="500" color="support">{{ formatTime(moment.time) }}</Text>
				</Flex>
			</Flex>

			<div v-if="moment.vehicles && moment.vehicles.length > 1" class="battle-info">
				<Text size="11" weight="500" color="secondary">
					Battle between {{ moment.vehicles.length }} vehicles
				</Text>
				<Text v-if="moment.timeDiff" size="11" weight="600" color="green">
					Gap: {{ formatTime(moment.timeDiff) }}
				</Text>
			</div>
		</Flex>
	</div>
</template>

<script setup>
import Icon from '@/components/Icon.vue'

const props = defineProps({
	moment: {
		type: Object,
		required: true
	},
	showDetails: {
		type: Boolean,
		default: false
	}
})

defineEmits(['view-details'])

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

function getTypeLabel(type) {
	const labels = {
		fastest_lap: 'FASTEST LAP',
		section_leader: 'SECTION LEADER',
		weather_change: 'WEATHER',
		close_battle: 'BATTLE',
		position_change: 'POSITION'
	}
	return labels[type] || type.replace(/_/g, ' ').toUpperCase()
}

function getImpactColor(impact) {
	const colors = {
		high: 'red',
		medium: 'yellow',
		low: 'green'
	}
	return colors[impact] || 'green'
}

function formatTime(ms) {
	if (!ms || ms === 0) return 'N/A'
	const minutes = Math.floor(ms / 60000)
	const seconds = Math.floor((ms % 60000) / 1000)
	const millis = ms % 1000
	return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}
</script>

<style scoped lang="scss">
.moment-card {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 16px;
	transition: all 0.3s ease;
	position: relative;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 3px;
		height: 100%;
		background: var(--impact-color);
		border-radius: 6px 0 0 6px;
	}

	&.impact-high {
		--impact-color: var(--red);
	}

	&.impact-medium {
		--impact-color: var(--yellow);
	}

	&.impact-low {
		--impact-color: var(--neon-lime);
	}

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(0, 255, 157, 0.3);
		box-shadow: 0 0 20px rgba(0, 255, 157, 0.15);
	}
}

.moment-impact {
	padding: 2px 8px;
	border-radius: 3px;
	border: 1px solid;

	&.impact-high {
		background: rgba(255, 71, 87, 0.1);
		border-color: var(--red);
		color: var(--red);
	}

	&.impact-medium {
		background: rgba(255, 193, 7, 0.1);
		border-color: var(--yellow);
		color: var(--yellow);
	}

	&.impact-low {
		background: rgba(0, 255, 157, 0.1);
		border-color: var(--neon-lime);
		color: var(--neon-lime);
	}
}

.battle-info {
	padding: 8px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 4px;
	border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
