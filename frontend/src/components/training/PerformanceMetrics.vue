<template>
	<div class="performance-metrics card">
		<h2>📊 Performance Metrics</h2>
		
		<div class="metrics-grid">
			<!-- Lap 1 Metrics -->
			<div class="metric-section">
				<h3>{{ lap1Label || 'Your Lap' }}</h3>
				<div class="metrics">
					<div class="metric">
						<span class="label">Max Speed</span>
						<span class="value">{{ metrics.lap1.stats.maxSpeed.toFixed(1) }} km/h</span>
					</div>
					<div class="metric">
						<span class="label">Avg Speed</span>
						<span class="value">{{ metrics.lap1.stats.avgSpeed.toFixed(1) }} km/h</span>
					</div>
					<div class="metric">
						<span class="label">Max RPM</span>
						<span class="value">{{ metrics.lap1.stats.maxRPM.toFixed(0) }}</span>
					</div>
					<div class="metric" v-if="metrics.lap1.brakingEfficiency">
						<span class="label">Braking Efficiency</span>
						<span class="value">{{ metrics.lap1.brakingEfficiency.efficiency.toFixed(1) }}%</span>
					</div>
					<div class="metric" v-if="metrics.lap1.throttleEfficiency">
						<span class="label">Optimal Throttle</span>
						<span class="value">{{ metrics.lap1.throttleEfficiency.optimalThrottlePercent.toFixed(1) }}%</span>
					</div>
				</div>
			</div>

			<!-- Lap 2 Metrics (if available) -->
			<div class="metric-section" v-if="metrics.lap2">
				<h3>{{ lap2Label || 'Reference Lap' }}</h3>
				<div class="metrics">
					<div class="metric">
						<span class="label">Max Speed</span>
						<span class="value">{{ metrics.lap2.stats.maxSpeed.toFixed(1) }} km/h</span>
					</div>
					<div class="metric">
						<span class="label">Avg Speed</span>
						<span class="value">{{ metrics.lap2.stats.avgSpeed.toFixed(1) }} km/h</span>
					</div>
					<div class="metric">
						<span class="label">Max RPM</span>
						<span class="value">{{ metrics.lap2.stats.maxRPM.toFixed(0) }}</span>
					</div>
					<div class="metric" v-if="metrics.lap2.brakingEfficiency">
						<span class="label">Braking Efficiency</span>
						<span class="value">{{ metrics.lap2.brakingEfficiency.efficiency.toFixed(1) }}%</span>
					</div>
					<div class="metric" v-if="metrics.lap2.throttleEfficiency">
						<span class="label">Optimal Throttle</span>
						<span class="value">{{ metrics.lap2.throttleEfficiency.optimalThrottlePercent.toFixed(1) }}%</span>
					</div>
				</div>
			</div>

			<!-- Comparison (if available) -->
			<div class="metric-section comparison" v-if="metrics.comparison">
				<h3>📈 Comparison</h3>
				<div class="metrics">
					<div class="metric" :class="getDiffClass(metrics.comparison.speedDiff.avg)">
						<span class="label">Avg Speed Diff</span>
						<span class="value">{{ formatDiff(metrics.comparison.speedDiff.avg) }} km/h</span>
					</div>
					<div class="metric" :class="getDiffClass(metrics.comparison.speedDiff.max)">
						<span class="label">Max Speed Diff</span>
						<span class="value">{{ formatDiff(metrics.comparison.speedDiff.max) }} km/h</span>
					</div>
					<div class="metric" :class="getDiffClass(metrics.comparison.throttleDiff.avg)">
						<span class="label">Throttle Diff</span>
						<span class="value">{{ formatDiff(metrics.comparison.throttleDiff.avg) }}%</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Sector Times -->
		<div class="sector-times" v-if="metrics.lap1.sectorTimes.length > 0">
			<h3>⏱️ Sector Times</h3>
			<div class="sectors">
				<div class="sector" v-for="sector in metrics.lap1.sectorTimes" :key="sector.sector">
					<div class="sector-header">Sector {{ sector.sector }}</div>
					<div class="sector-stats">
						<span>Avg Speed: {{ sector.stats.avgSpeed.toFixed(1) }} km/h</span>
						<span v-if="metrics.lap2">
							Diff: {{ formatDiff(sector.stats.avgSpeed - metrics.lap2.sectorTimes[sector.sector - 1]?.stats.avgSpeed) }} km/h
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
	metrics: {
		type: Object,
		required: true
	},
	lap1Label: {
		type: String,
		default: 'Your Lap'
	},
	lap2Label: {
		type: String,
		default: 'Reference Lap'
	}
})

const formatDiff = (value) => {
	if (!value) return '0.0'
	return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
}

const getDiffClass = (value) => {
	if (!value) return ''
	return value > 0 ? 'positive' : 'negative'
}
</script>

<style scoped lang="scss">
.performance-metrics {
	h2 {
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}
}

.metrics-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.metric-section {
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	padding: 1.5rem;
	border-radius: 12px;
	
	&.comparison {
		background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
	}
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.metrics {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.metric {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem;
	background: white;
	border-radius: 8px;
	
	&.positive {
		background: #d1fae5;
		
		.value {
			color: #065f46;
		}
	}
	
	&.negative {
		background: #fee2e2;
		
		.value {
			color: #991b1b;
		}
	}
	
	.label {
		font-weight: 500;
		color: #6b7280;
	}
	
	.value {
		font-weight: 700;
		font-size: 1.1rem;
		color: #1f2937;
	}
}

.sector-times {
	margin-top: 2rem;
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.sectors {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
}

.sector {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	padding: 1rem;
	border-radius: 12px;
	color: white;
	
	.sector-header {
		font-weight: 700;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}
	
	.sector-stats {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		opacity: 0.9;
	}
}
</style>
