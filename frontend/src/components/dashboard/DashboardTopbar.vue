<script setup>
import { computed } from "vue"
import { useAppStore } from "@/stores/app"
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown"

const props = defineProps({
	currentPage: Object,
	isMobile: Boolean
})

const appStore = useAppStore()

const handleNetworkChange = (networkKey) => {
	appStore.setNetwork(networkKey)
}
</script>

<template>
	<header :class="$style.topbar">
		<Flex align="center" justify="between" wide>
			<Flex align="center" gap="16">
				<Text size="18" weight="700" color="primary">{{ currentPage?.name || 'DASHBOARD' }}</Text>
				<div :class="$style.statusIndicator" />
				<Text size="12" weight="600" color="green">SYNCHRONIZED</Text>
			</Flex>

			<Flex align="center" gap="16">
				<!-- Network Selector -->
				<!-- <Dropdown fullWidth height="300px" verticalOverflow>
					<Flex align="center" gap="16" :class="$style.networkSelector">
						<Flex align="center" gap="8">
							<div :class="$style.networkDot" />
							<Text size="13" weight="700" color="primary" style="text-transform: uppercase">
								{{ appStore.network }}
							</Text>
						</Flex>
						<Icon name="chevron" size="14" color="tertiary" />
					</Flex>

					<template #popup>
						<DropdownItem 
							v-for="network in appStore.networks" 
							:key="network.key" 
							@click="handleNetworkChange(network.key)"
						>
							<Flex align="center" gap="8">
								<Icon :name="appStore.network === network.key ? 'check' : ''" size="14" color="secondary" /> 
								{{ network.name }}
							</Flex>
						</DropdownItem>
					</template>
				</Dropdown> -->

				<!-- Home Link -->
				<router-link to="/" :class="$style.homeLink">
					<Icon name="arrow-top-right" size="16" color="secondary" />
					<Text v-if="!isMobile" size="12" weight="700" color="secondary">MAIN VIEW</Text>
				</router-link>
			</Flex>
		</Flex>
	</header>
</template>

<style module>
.topbar {
	height: 70px;
	background: linear-gradient(90deg, rgba(255, 0, 255, 0.05) 0%, rgba(0, 255, 255, 0.05) 100%);
	border-bottom: 2px solid rgba(0, 255, 255, 0.2);
	padding: 0 24px;
	display: flex;
	align-items: center;
}

.statusIndicator {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #00ff9d;
	box-shadow: 0 0 10px #00ff9d;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

.networkSelector {
	height: 36px;
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.3);
	border-radius: 6px;
	padding: 0 12px;
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 140px;
}

.networkSelector:hover {
	border-color: rgba(0, 255, 255, 0.5);
	box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.networkDot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #00ffff;
	box-shadow: 0 0 8px #00ffff;
}

.homeLink {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	background: rgba(255, 0, 255, 0.1);
	border: 1px solid rgba(255, 0, 255, 0.3);
	border-radius: 6px;
	transition: all 0.2s ease;
	text-decoration: none;
}

.homeLink:hover {
	background: rgba(255, 0, 255, 0.2);
	box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
}
</style>