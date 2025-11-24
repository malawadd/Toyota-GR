<script setup>
import { computed } from "vue"
import { useRacingStore } from "@/stores/racing"
import { formatSectionTime, formatCarNumber } from "@/services/formatters"

const racingStore = useRacingStore()

const sectionLeaders = computed(() => racingStore.sectionLeaders || {})
</script>

<template>
	<Flex direction="column" gap="16" :class="$style.wrapper">
		<Flex align="center" justify="between">
			<Text size="16" weight="700" color="primary">SECTION LEADERS</Text>
			<Icon name="check-circle" size="20" color="green" />
		</Flex>

		<Flex direction="column" gap="12">
			<Flex direction="column" gap="6" :class="$style.sectionCard">
				<Text size="12" weight="700" color="tertiary">SECTOR 1</Text>
				<Flex align="center" justify="between">
					<Text size="14" weight="600" color="primary">
						{{ sectionLeaders.s1?.vehicle_id ? formatCarNumber(sectionLeaders.s1.vehicle_id.split('-')[2]) : '--' }}
					</Text>
					<Text size="13" weight="600" color="secondary" mono>
						{{ sectionLeaders.s1?.time ? formatSectionTime(sectionLeaders.s1.time) : '--' }}
					</Text>
				</Flex>
			</Flex>

			<Flex direction="column" gap="6" :class="$style.sectionCard">
				<Text size="12" weight="700" color="tertiary">SECTOR 2</Text>
				<Flex align="center" justify="between">
					<Text size="14" weight="600" color="primary">
						{{ sectionLeaders.s2?.vehicle_id ? formatCarNumber(sectionLeaders.s2.vehicle_id.split('-')[2]) : '--' }}
					</Text>
					<Text size="13" weight="600" color="secondary" mono>
						{{ sectionLeaders.s2?.time ? formatSectionTime(sectionLeaders.s2.time) : '--' }}
					</Text>
				</Flex>
			</Flex>

			<Flex direction="column" gap="6" :class="$style.sectionCard">
				<Text size="12" weight="700" color="tertiary">SECTOR 3</Text>
				<Flex align="center" justify="between">
					<Text size="14" weight="600" color="primary">
						{{ sectionLeaders.s3?.vehicle_id ? formatCarNumber(sectionLeaders.s3.vehicle_id.split('-')[2]) : '--' }}
					</Text>
					<Text size="13" weight="600" color="secondary" mono>
						{{ sectionLeaders.s3?.time ? formatSectionTime(sectionLeaders.s3.time) : '--' }}
					</Text>
				</Flex>
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

.sectionCard {
	background: rgba(0, 0, 0, 0.4);
	padding: 12px;
	border-radius: 6px;
	border: 1px solid var(--op-10);
	transition: all 0.3s ease;
}

.sectionCard:hover {
	background: rgba(0, 255, 157, 0.05);
	border-color: var(--neon-lime);
}
</style>
