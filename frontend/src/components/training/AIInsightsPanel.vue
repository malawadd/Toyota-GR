<template>
	<div class="ai-insights-panel card">
		<div class="panel-header">
			<h2>🤖 AI-Powered Insights</h2>
			<div v-if="analyzing" class="analyzing-badge">
				<span class="pulse"></span>
				Analyzing...
			</div>
		</div>

		<div v-if="insights" class="insights-content">
			<!-- Overall Assessment -->
			<div class="assessment-section">
				<h3>📋 Overall Assessment</h3>
				<p class="assessment-text">{{ insights.overallAssessment }}</p>
			</div>

			<!-- Strengths & Weaknesses -->
			<div class="strengths-weaknesses">
				<div class="strength-section">
					<h3>💪 Strengths</h3>
					<ul>
						<li v-for="(strength, index) in insights.strengths" :key="index">
							{{ strength }}
						</li>
					</ul>
				</div>

				<div class="weakness-section">
					<h3>⚠️ Areas for Improvement</h3>
					<ul>
						<li v-for="(weakness, index) in insights.weaknesses" :key="index">
							{{ weakness }}
						</li>
					</ul>
				</div>
			</div>

			<!-- Key Insights -->
			<div class="key-insights-section">
				<h3>🔑 Key Insights</h3>
				<div class="insights-grid">
					<div 
						v-for="(insight, index) in insights.keyInsights" 
						:key="index"
						class="insight-card"
						:class="`area-${insight.area.toLowerCase()}`"
					>
						<div class="insight-header">
							<span class="area-badge">{{ insight.area }}</span>
						</div>
						<p class="insight-text">{{ insight.insight }}</p>
						<div class="recommendation">
							<strong>💡 Recommendation:</strong>
							<p>{{ insight.recommendation }}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Improvement Priorities -->
			<div class="priorities-section" v-if="insights.improvementPriorities">
				<h3>🎯 Improvement Priorities</h3>
				<div class="priorities-list">
					<div 
						v-for="(priority, index) in sortedPriorities" 
						:key="index"
						class="priority-item"
						:class="`priority-${priority.priority}`"
					>
						<div class="priority-header">
							<span class="priority-badge">Priority {{ priority.priority }}</span>
							<span class="expected-gain">{{ priority.expectedGain }}</span>
						</div>
						<h4>{{ priority.area }}</h4>
						<p>{{ priority.description }}</p>
					</div>
				</div>
			</div>
		</div>

		<div v-else class="no-insights">
			<p>Select laps and click "Analyze Performance" to get AI-powered insights.</p>
		</div>
	</div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
	insights: {
		type: Object,
		default: null
	},
	analyzing: {
		type: Boolean,
		default: false
	}
})

const sortedPriorities = computed(() => {
	if (!props.insights?.improvementPriorities) return []
	return [...props.insights.improvementPriorities].sort((a, b) => a.priority - b.priority)
})
</script>

<style scoped lang="scss">
.ai-insights-panel {
	.panel-header {
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

.analyzing-badge {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 20px;
	font-weight: 600;
	
	.pulse {
		width: 10px;
		height: 10px;
		background: white;
		border-radius: 50%;
		animation: pulse 1.5s infinite;
	}
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

.insights-content {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.assessment-section {
	h3 {
		font-size: 1.25rem;
		margin-bottom: 0.75rem;
		color: #374151;
	}
	
	.assessment-text {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #4b5563;
		background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
		padding: 1.5rem;
		border-radius: 12px;
		border-left: 4px solid #0284c7;
	}
}

.strengths-weaknesses {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
	
	ul {
		list-style: none;
		padding: 0;
		
		li {
			padding: 0.75rem 1rem;
			margin-bottom: 0.5rem;
			border-radius: 8px;
			line-height: 1.5;
		}
	}
	
	.strength-section {
		ul li {
			background: #d1fae5;
			border-left: 4px solid #059669;
			color: #065f46;
		}
	}
	
	.weakness-section {
		ul li {
			background: #fee2e2;
			border-left: 4px solid #dc2626;
			color: #991b1b;
		}
	}
}

.key-insights-section {
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.insights-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
}

.insight-card {
	padding: 1.5rem;
	border-radius: 12px;
	border: 2px solid;
	background: white;
	
	&.area-braking {
		border-color: #ef4444;
		background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
	}
	
	&.area-acceleration {
		border-color: #10b981;
		background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
	}
	
	&.area-cornering {
		border-color: #f59e0b;
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	}
	
	&.area-consistency {
		border-color: #3b82f6;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	}
	
	&.area-racing {
		border-color: #8b5cf6;
		background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
	}
	
	.insight-header {
		margin-bottom: 1rem;
	}
	
	.area-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	.insight-text {
		font-size: 1rem;
		line-height: 1.6;
		color: #374151;
		margin-bottom: 1rem;
	}
	
	.recommendation {
		background: white;
		padding: 1rem;
		border-radius: 8px;
		
		strong {
			display: block;
			margin-bottom: 0.5rem;
			color: #1f2937;
		}
		
		p {
			color: #4b5563;
			line-height: 1.5;
		}
	}
}

.priorities-section {
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.priorities-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.priority-item {
	padding: 1.5rem;
	border-radius: 12px;
	border-left: 6px solid;
	background: white;
	
	&.priority-1 {
		border-color: #dc2626;
		background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
	}
	
	&.priority-2 {
		border-color: #f59e0b;
		background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
	}
	
	&.priority-3 {
		border-color: #3b82f6;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	}
	
	&.priority-4,
	&.priority-5 {
		border-color: #6b7280;
		background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
	}
	
	.priority-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	
	.priority-badge {
		padding: 0.25rem 0.75rem;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	.expected-gain {
		font-weight: 700;
		color: #059669;
	}
	
	h4 {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}
	
	p {
		color: #4b5563;
		line-height: 1.6;
	}
}

.no-insights {
	text-align: center;
	padding: 3rem;
	color: #6b7280;
	font-size: 1.1rem;
}
</style>
