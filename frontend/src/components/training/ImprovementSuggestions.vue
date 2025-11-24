<template>
	<div class="improvement-suggestions card">
		<h2>🎯 Actionable Improvement Suggestions</h2>

		<div v-if="insights.improvementPriorities" class="suggestions-container">
			<div 
				v-for="(priority, index) in sortedPriorities" 
				:key="index"
				class="suggestion-card"
				:class="`priority-${priority.priority}`"
			>
				<div class="suggestion-header">
					<div class="priority-indicator">
						<span class="priority-number">{{ priority.priority }}</span>
						<span class="priority-label">Priority</span>
					</div>
					<div class="expected-gain-badge">
						{{ priority.expectedGain }}
					</div>
				</div>

				<h3>{{ priority.area }}</h3>
				<p class="description">{{ priority.description }}</p>

				<div class="action-steps">
					<h4>📝 Action Steps:</h4>
					<ul>
						<li v-for="(step, stepIndex) in generateActionSteps(priority)" :key="stepIndex">
							{{ step }}
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Quick Tips -->
		<div class="quick-tips">
			<h3>⚡ Quick Tips</h3>
			<div class="tips-grid">
				<div class="tip-card" v-for="(strength, index) in insights.strengths" :key="index">
					<span class="tip-icon">✅</span>
					<p>Keep doing: {{ strength }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
	insights: {
		type: Object,
		required: true
	}
})

const sortedPriorities = computed(() => {
	if (!props.insights?.improvementPriorities) return []
	return [...props.insights.improvementPriorities].sort((a, b) => a.priority - b.priority)
})

const generateActionSteps = (priority) => {
	// Generate action steps based on the area
	const steps = []
	
	if (priority.area.toLowerCase().includes('braking')) {
		steps.push('Practice threshold braking in a safe environment')
		steps.push('Focus on brake release timing at corner entry')
		steps.push('Review onboard footage to identify late braking opportunities')
	} else if (priority.area.toLowerCase().includes('throttle') || priority.area.toLowerCase().includes('acceleration')) {
		steps.push('Work on progressive throttle application')
		steps.push('Practice earlier throttle application at corner exit')
		steps.push('Focus on maintaining smooth inputs')
	} else if (priority.area.toLowerCase().includes('corner') || priority.area.toLowerCase().includes('racing line')) {
		steps.push('Study the ideal racing line for each corner')
		steps.push('Practice hitting consistent apex points')
		steps.push('Work on corner entry and exit positioning')
	} else if (priority.area.toLowerCase().includes('consistency')) {
		steps.push('Focus on repeatable reference points')
		steps.push('Practice maintaining consistent speeds through corners')
		steps.push('Work on smooth, predictable inputs')
	} else {
		steps.push('Review telemetry data to identify specific areas')
		steps.push('Practice the technique in isolation')
		steps.push('Gradually integrate into full laps')
	}
	
	return steps
}
</script>

<style scoped lang="scss">
.improvement-suggestions {
	h2 {
		font-size: 1.75rem;
		margin-bottom: 1.5rem;
		color: #1f2937;
	}
}

.suggestions-container {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.suggestion-card {
	padding: 2rem;
	border-radius: 16px;
	border: 3px solid;
	background: white;
	transition: all 0.3s;
	
	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
	}
	
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
}

.suggestion-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1.5rem;
}

.priority-indicator {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	
	.priority-number {
		width: 50px;
		height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		font-size: 1.5rem;
		font-weight: 700;
	}
	
	.priority-label {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}
}

.expected-gain-badge {
	padding: 0.75rem 1.5rem;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border-radius: 20px;
	font-weight: 700;
	font-size: 1.1rem;
}

h3 {
	font-size: 1.5rem;
	margin-bottom: 1rem;
	color: #1f2937;
}

.description {
	font-size: 1.1rem;
	line-height: 1.6;
	color: #4b5563;
	margin-bottom: 1.5rem;
}

.action-steps {
	background: white;
	padding: 1.5rem;
	border-radius: 12px;
	
	h4 {
		font-size: 1.1rem;
		margin-bottom: 1rem;
		color: #374151;
	}
	
	ul {
		list-style: none;
		padding: 0;
		
		li {
			padding: 0.75rem;
			margin-bottom: 0.5rem;
			background: #f9fafb;
			border-radius: 8px;
			border-left: 4px solid #667eea;
			color: #374151;
			line-height: 1.5;
			
			&:before {
				content: '→ ';
				margin-right: 0.5rem;
				color: #667eea;
				font-weight: 700;
			}
		}
	}
}

.quick-tips {
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 2px solid #e5e7eb;
	
	h3 {
		font-size: 1.25rem;
		margin-bottom: 1rem;
		color: #374151;
	}
}

.tips-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
}

.tip-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
	border-radius: 12px;
	border: 2px solid #10b981;
	
	.tip-icon {
		font-size: 1.5rem;
	}
	
	p {
		color: #065f46;
		font-weight: 600;
		line-height: 1.4;
	}
}
</style>
