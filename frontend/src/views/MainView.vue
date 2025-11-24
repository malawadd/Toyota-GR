<script setup>
import { useRouter } from "vue-router"
import GlobeWidget from "@/components/widgets/GlobeWidget.vue"
import FastestLapWidget from "@/components/widgets/FastestLapWidget.vue"
import WeatherWidget from "@/components/widgets/WeatherWidget.vue"
import SectionLeadersWidget from "@/components/widgets/SectionLeadersWidget.vue"
import ActiveVehiclesWidget from "@/components/widgets/ActiveVehiclesWidget.vue"
import RaceStatsWidget from "@/components/widgets/RaceStatsWidget.vue"
import LiveTelemetryWidget from "@/components/widgets/LiveTelemetryWidget.vue"

const router = useRouter()
const enterDashboard = () => {
	router.push({ name: 'dashboard' })
}
</script>

<template>
	<Flex gap="20" :class="$style.wrapper">
		<button @click="enterDashboard" :class="$style.dashboardButton">
			<Icon name="arrow-top-right" size="20" color="green" />
			<Text size="14" weight="700" color="green">ENTER DASHBOARD</Text>
		</button>

		<Flex direction="column" gap="20" :class="$style.left_column">
			<GlobeWidget />

			<Flex gap="20" :class="$style.bottom">
				<FastestLapWidget />
				<WeatherWidget />
				<SectionLeadersWidget />
			</Flex>
		</Flex>

		<Flex direction="column" gap="20" :class="$style.right_column">
			<LiveTelemetryWidget />
			<ActiveVehiclesWidget />
			<RaceStatsWidget />
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	width: 100%;
	height: 100%;
	padding: 20px;
	position: relative;
}

.dashboardButton {
	position: fixed;
	top: 20px;
	right: 20px;
	z-index: 100;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 24px;
	background: rgba(0, 255, 157, 0.15);
	border: 2px solid var(--neon-lime);
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
}

.dashboardButton:hover {
	background: rgba(0, 255, 157, 0.25);
	box-shadow: 0 0 30px rgba(0, 255, 157, 0.5);
	transform: translateY(-2px);
}

.left_column {
	width: 100%;

	& .bottom {
		min-height: 220px;
	}
}

.right_column {
	min-width: 400px;
	height: 100%;
}

@media (max-width: 2000px) {
	.bottom {
		& > div {
			flex: 1;
			min-width: initial;
			width: initial;
		}
	}
}

@media (max-width: 1500px) {
	.wrapper {
		flex-direction: column;
	}
}

@media (max-width: 1000px) {
	.bottom {
		flex-direction: column;
	}

	.bottom {
		& > div {
			gap: 16px;
		}
	}

	.left_column {
		& .bottom {
			min-height: initial;
		}
	}
}

@media (max-width: 700px) {
	.wrapper {
		padding: 12px;
	}

	.dashboardButton {
		top: 12px;
		right: 12px;
		padding: 10px 16px;
	}
}
</style>
