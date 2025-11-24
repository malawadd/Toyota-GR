<script setup>
import { ref, onMounted } from "vue"
import { DateTime } from "luxon"
import RaceTrackAnimation from "../local/RaceTrackAnimation.vue"

const globeWidgetEl = ref(null)
const currentTime = ref(DateTime.now())

onMounted(() => {
	setInterval(() => {
		currentTime.value = DateTime.now()
	}, 1000)
})
</script>

<template>
	<Flex direction="column" gap="16" ref="globeWidgetEl" :class="$style.wrapper">
		<Flex align="center" justify="between">
			<Flex direction="column" gap="4">
				<Text size="18" weight="700" color="primary">TOYOTA GR CUP SERIES</Text>
				<Text size="13" weight="600" color="tertiary">{{ currentTime.toFormat("MMMM dd, yyyy") }}</Text>
			</Flex>
			<Flex direction="column" gap="2" align="end">
				<Text size="24" weight="700" color="primary" mono>{{ currentTime.toFormat("HH:mm:ss") }}</Text>
				<Text size="11" weight="600" color="support">LIVE DASHBOARD</Text>
			</Flex>
		</Flex>

		<div :class="$style.globe">
			<RaceTrackAnimation />
		</div>

		<Flex align="center" justify="between" :class="$style.footer">
			<Text size="12" weight="500" color="tertiary">Real-time Race Monitoring</Text>
			<div :class="$style.liveDot" />
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	background: var(--card-background);
	border: 2px solid var(--card-border);
	border-radius: 12px;
	padding: 20px;
	min-height: 500px;
	position: relative;
}

.globe {
	flex: 1;
	min-height: 400px;
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	background: radial-gradient(circle at 50% 50%, rgba(0, 255, 157, 0.05) 0%, transparent 70%);
}

.footer {
	padding-top: 12px;
	border-top: 1px solid var(--op-10);
}

.liveDot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: var(--neon-lime);
	box-shadow: 0 0 15px var(--neon-lime);
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.6;
		transform: scale(1.2);
	}
}
</style>
