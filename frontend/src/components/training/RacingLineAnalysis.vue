<template>
	<div class="racing-line-analysis card">
		<div class="header">
			<h2>🏁 Racing Line Analysis</h2>
			<button 
				class="analyze-btn" 
				@click="$emit('analyze')"
				:disabled="!corners || corners.length === 0"
			>
				🤖 Analyze Racing Line with AI
			</button>
		</div>

		<!-- Corners Overview -->
		<div class="corners-overview">
			<h3>📍 Identified Corners: {{ corners.length }}</h3>
			<div class="corners-grid">
				<div 
					v-for="(corner, index) in corners" 
					:key="index"
					class="corner-card"
				>
					<div class="corner-header">
						<h4>{{ corner.name }}</h4>
						<span class="corner-duration">{{ corner.duration }} points</span>
					</div>
					<div class="corner-speeds">
						<div class="speed-item">
							<span class="label">Entry</span>
							<span class="value">{{ corner.entrySpeed.toFixed(1) }} km/h</span>
						</div>
						<div class="speed-item apex">
							<span class="label">Apex</span>
							<span class="value">{{ corner.apexSpeed.toFixed(1) }} km/h</span>
						</div>
						<div class="speed-item">
							<span class="label">Exit</span>
							<span class="value">{{ corner.exitSpeed.toFixed(1) }} km/h</span>
						</div>
					</div>

					<!-- Comparison with reference -->
					<div v-if="referenceCorners && referenceCorners[index]" class="corner-comparison">
						<div class="comparison-item">
							<span>Entry Diff:</span>
							<span :class="getDiffClass(corner.entrySpeed - referenceCorners[index].entrySpeed)">
								{{ formatDiff(corner.entrySpeed - referenceCorners[index].entrySpeed) }} km/h
							</span>
						</div>
						<div class="comparison-item">
							<span>Apex Diff:</span>
							<span :class="getDiffClass(corner.apexSpeed - referenceCorners[index].apexSpeed)">
								{{ formatDiff(corner.apexSpeed - referenceCorners[index].apexSpeed) }} km/h
							</span>
						</div>
						<div class="comparison-item">
							<span>Exit Diff:</span>
							<span :class="getDiffClass(corner.exitSpeed - referenceCorners[index].exitSpeed)">
								{{ formatDiff(corner.exitSpeed - referenceCorners[index].exitSpeed) }} km/h
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- AI Racing Line Analysis -->
		<div v-if="racingLineAnalysis" class="ai-analysis">
			<h3>🤖 AI Racing Line Assessment</h3>
			<p class="assessment">{{ racingLineAnalysis.racingLineAssessment }}</p>

			<div v-if="racingLineAnalysis.cornerAnalysis" class="corner-analysis-grid">
				<div 
					v-for="(analysis, index) in racingLineAnalysis.cornerAnalysis" 
					:key="index"
					class="corner-analysis-card"
				>
					<h4>{{ analysis.corner }}</h4>
					<div class="analysis-section">
						<strong>Assessment:</strong>
						<p>{{ analysis.assessment }}</p>
					</div>
					<div class="analysis-section">
						<strong>Optimization:</strong>
						<p>{{ analysis.optimization }}</p>
					</div>
					<div class="expected-gain">
						Expected Gain: {{ analysis.expectedGain }}
					</div>
				</div>
			</div>

			<div v-if="racingLineAnalysis.generalTips" class="general-tips">
				<h4>💡 General Racing Line Tips</h4>
				<ul>
					<li v-for="(tip, index) in racingLineAnalysis.generalTips" :key="index">
						{{ tip }}
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
	corners: {
		type: Array,
		required: true
	},
	referenceCorners: {
		type: Array,
		default: () => []
	},
	racingLineAnalysis: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['analyze'])

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
.racing-line-analysis {
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		
		h2 {
			font-size: 1.75rem;
			color: #1f2937;
		}
	}
}

.analyze-btn {
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s;
	
	&:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.corners-overview {
	margin-bottom: 2rem;
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.corners-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
}

.corner-card {
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	padding: 1.5rem;
	border-radius: 12px;
	border: 2px solid #0284c7;
	
	.corner-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		
		h4 {
			font-size: 1.1rem;
			color: #0c4a6e;
		}
		
		.corner-duration {
			font-size: 0.875rem;
			color: #64748b;
		}
	}
}

.corner-speeds {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.speed-item {
	display: flex;
	justify-content: space-between;
	padding: 0.5rem;
	background: white;
	border-radius: 6px;
	
	&.apex {
		background: #fef3c7;
		font-weight: 700;
	}
	
	.label {
		color: #64748b;
	}
	
	.value {
		color: #0c4a6e;
		font-weight: 600;
	}
}

.corner-comparison {
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 2px solid rgba(2, 132, 199, 0.2);
}

.comparison-item {
	display: flex;
	justify-content: space-between;
	padding: 0.25rem 0;
	font-size: 0.875rem;
	
	.positive {
		color: #059669;
		font-weight: 600;
	}
	
	.negative {
		color: #dc2626;
		font-weight: 600;
	}
}

.ai-analysis {
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid #e5e7eb;
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
	
	.assessment {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #4b5563;
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
		padding: 1.5rem;
		border-radius: 12px;
		border-left: 4px solid #10b981;
		margin-bottom: 1.5rem;
	}
}

.corner-analysis-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.corner-analysis-card {
	background: white;
	padding: 1.5rem;
	border-radius: 12px;
	border: 2px solid #e5e7eb;
	
	h4 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
		color: #1f2937;
	}
	
	.analysis-section {
		margin-bottom: 1rem;
		
		strong {
			display: block;
			margin-bottom: 0.5rem;
			color: #374151;
		}
		
		p {
			color: #6b7280;
			line-height: 1.5;
		}
	}
	
	.expected-gain {
		padding: 0.75rem;
		background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
		border-radius: 8px;
		color: #065f46;
		font-weight: 700;
		text-align: center;
	}
}

.general-tips {
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	padding: 1.5rem;
	border-radius: 12px;
	
	h4 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
		color: #78350f;
	}
	
	ul {
		list-style: none;
		padding: 0;
		
		li {
			padding: 0.75rem;
			margin-bottom: 0.5rem;
			background: white;
			border-radius: 8px;
			color: #92400e;
			line-height: 1.5;
			
			&:before {
				content: '💡 ';
				margin-right: 0.5rem;
			}
		}
	}
}
</style>
