<script setup>
import { computed } from "vue"
import { useRacingStore } from "@/stores/racing"
import { formatTemperature, formatPressure, formatWindSpeed, formatWindDirection } from "@/services/formatters"

const racingStore = useRacingStore()

const weather = computed(() => racingStore.weather || {})
</script>

<template>
	<Flex direction="column" gap="16" :class="$style.wrapper">
		<Flex align="center" justify="between">
			<Text size="16" weight="700" color="primary">WEATHER</Text>
			<Icon name="zap" size="20" color="blue" />
		</Flex>

		<Flex direction="column" gap="12">
			<Flex align="center" gap="12">
				<Text size="13" weight="500" color="tertiary" no-wrap style="min-width: 80px;">Air Temp</Text>
				<div :class="$style.dots" />
				<Text size="13" weight="600" color="primary" mono no-wrap>
					{{ formatTemperature(weather.avgAirTemp) }}
				</Text>
			</Flex>

			<Flex align="center" gap="12">
				<Text size="13" weight="500" color="tertiary" no-wrap style="min-width: 80px;">Track Temp</Text>
				<div :class="$style.dots" />
				<Text size="13" weight="600" color="primary" mono no-wrap>
					{{ formatTemperature(weather.avgTrackTemp) }}
				</Text>
			</Flex>

			<Flex align="center" gap="12">
				<Text size="13" weight="500" color="tertiary" no-wrap style="min-width: 80px;">Humidity</Text>
				<div :class="$style.dots" />
				<Text size="13" weight="600" color="primary" mono no-wrap>
					{{ weather.avgHumidity ? `${weather.avgHumidity.toFixed(1)}%` : '--' }}
				</Text>
			</Flex>

			<Flex align="center" gap="12">
				<Text size="13" weight="500" color="tertiary" no-wrap style="min-width: 80px;">Wind</Text>
				<div :class="$style.dots" />
				<Text size="13" weight="600" color="primary" mono no-wrap>
					{{ weather.avgWindSpeed ? `${formatWindSpeed(weather.avgWindSpeed)} ${formatWindDirection(weather.avgWindDirection || 0)}` : '--' }}
				</Text>
			</Flex>
		</Flex>
	</Flex>
</template>

<style module>
.wrapper {
	background: var(--card-background);
	padding: 20px;
	border-radius: 12px;
	border: 2px solid var(--card-border);
	min-width: 300px;
}

.dots {
	width: 100%;
	height: 2px;
	background-image: linear-gradient(to right, var(--op-10) 33%, rgba(255, 255, 255, 0) 0%);
	background-position: bottom;
	background-size: 6px 2px;
	background-repeat: repeat-x;
}
</style>
