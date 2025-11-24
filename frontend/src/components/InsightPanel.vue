<template>
	<div class="insight-panel" :class="`confidence-${insight.confidence}`">
		<Flex direction="column" gap="12">
			<Flex align="center" justify="between">
				<Flex align="center" gap="8">
					<Icon :name="getCategoryIcon(insight.category)" size="16" color="green" />
					<Text size="11" weight="700" color="tertiary">{{ getCategoryLabel(insight.category) }}</Text>
				</Flex>
				<div v-if="insight.confidence" class="confidence-indicator">
					<div class="confidence-dots">
						<span 
							v-for="i in 3" 
							:key="i" 
							class="dot" 
							:class="{ active: getConfidenceLevel(insight.confidence) >= i }"
						></span>
					</div>
				</div>
			</Flex>

			<Text size="15" weight="700" color="primary">{{ insight.title }}</Text>
			<Text size="13" weight="500" color="secondary" style="line-height: 1.5;">
				{{ insight.description }}
			</Text>

			<div v-if="insight.data" class="insight-data">
				<slot name="data" :data="insight.data">
					<!-- Default data display -->
					<Flex direction="column" gap="6">
						<Flex v-if="insight.data.avgTime" justify="between">
							<Text size="11" weight="500" color="support">Average Time:</Text>
							<Text size="11" weight="700" color="green" mono>{{ formatTime(insight.data.avgTime) }}</Text>
						</Flex>
						<Flex v-if="insight.data.stdDev" justify="between">
							<Text size="11" weight="500" color="support">Consistency:</Text>
							<Text size="11" weight="700" color="green" mono>±{{ formatTime(insight.data.stdDev) }}</Text>
						</Flex>
					</Flex>
				</slot>
			</div>
		</Flex>
	</div>
</template>

<script setup>
import Icon from '@/components/Icon.vue'

const props = defineProps({
	insight: {
		type: Object,
		required: true
	}
})

function getCategoryIcon(category) {
	const icons = {
		consistency: 'activity',
		weather_strategy: 'cloud',
		race_craft: 'award',
		tire_strategy: 'disc',
		fuel_management: 'droplet',
		overtaking: 'zap'
	}
	return icons[category] || 'lightbulb'
}

function getCategoryLabel(category) {
	return category.replace(/_/g, ' ').toUpperCase()
}

function getConfidenceLevel(confidence) {
	const levels = { high: 3, medium: 2, low: 1 }
	return levels[confidence] || 1
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
.insight-panel {
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
		right: 0;
		height: 2px;
		background: rgba(0, 255, 157, 0.5);
		border-radius: 6px 6px 0 0;
	}

	&:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(0, 255, 157, 0.3);
		box-shadow: 0 0 20px rgba(0, 255, 157, 0.15);
	}

	&.confidence-high::before {
		background: var(--neon-lime);
	}

	&.confidence-medium::before {
		background: var(--yellow);
	}

	&.confidence-low::before {
		background: rgba(255, 255, 255, 0.3);
	}
}

.confidence-indicator {
	display: flex;
	align-items: center;
	gap: 4px;
}

.confidence-dots {
	display: flex;
	gap: 4px;
}

.dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.2);
	transition: all 0.3s ease;

	&.active {
		background: #00ff9d;
		box-shadow: 0 0 6px rgba(0, 255, 157, 0.5);
	}
}

.insight-data {
	padding: 12px;
	background: rgba(0, 0, 0, 0.3);
	border-radius: 4px;
	border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
