<script setup>
import { ref, onMounted } from "vue"

const props = defineProps({
	vaults: Array
})

const animationProgress = ref(0)

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatAddress = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`


onMounted(() => {
	const animate = () => {
		animationProgress.value += 0.02
		if (animationProgress.value < 1) {
			requestAnimationFrame(animate)
		}
	}
	
	setTimeout(animate, 700)
})
</script>

<template>
	<div :class="$style.container">
		<Text size="18" weight="700" color="primary">VAULT INTERACTIONS</Text>
		
		<div v-if="!vaults?.length" :class="$style.noData">
			<Text size="14" weight="600" color="tertiary">NO VAULT INTERACTIONS FOUND</Text>
		</div>
		
		<div v-else :class="$style.vaultGrid">
			<router-link
				v-for="(vault, index) in vaults"
				:key="vault.id"
				:to="`/dashboard/vault/${vault.id}`"
				:class="$style.vaultCard"
				:style="{
					opacity: animationProgress > (index * 0.1) ? 1 : 0,
					transform: `translateY(${animationProgress > (index * 0.1) ? 0 : 20}px)`,
					animationDelay: `${index * 0.1}s`
				}"
			>
				<div :class="$style.vaultHeader">
					<Flex align="center" justify="between">
						<Text size="12" weight="700" color="primary">VAULT</Text>
						<Icon name="arrow-top-right" size="12" color="secondary" />
					</Flex>
					
					<Text size="11" weight="600" color="secondary" mono>
						{{ formatAddress(vault.id) }}
					</Text>
				</div>
				
				<div :class="$style.vaultMetrics">
					<div :class="$style.metric">
						<Text size="10" weight="600" color="tertiary">BALANCE</Text>
						<Text size="13" weight="700" color="green" mono>
							{{ formatAmount(vault.balance) }}
						</Text>
					</div>
					
					<div :class="$style.metric">
						<Text size="10" weight="600" color="tertiary">DEBT</Text>
						<Text size="13" weight="700" color="red" mono>
							{{ formatAmount(vault.debt) }}
						</Text>
					</div>
				</div>
				
				<!-- Health indicator -->
				<div :class="$style.healthBar">
					<div 
						:class="$style.healthFill"
						:style="{
							width: `${Math.min(100, (parseFloat(vault.debt) / Math.max(parseFloat(vault.balance), 1)) * 100)}%`,
							background: parseFloat(vault.debt) / parseFloat(vault.balance) > 0.8 ? '#ff0040' : 
										parseFloat(vault.debt) / parseFloat(vault.balance) > 0.6 ? '#ff6600' : '#00ff9d'
						}"
					/>
				</div>
			</router-link>
		</div>
	</div>
</template>

<style module>
.container {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 170, 255, 0.2);
	border-radius: 8px;
	padding: 24px;
}

.noData {
	text-align: center;
	padding: 40px;
}

.vaultGrid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 16px;
	margin-top: 16px;
}

.vaultCard {
	background: linear-gradient(135deg, rgba(0, 170, 255, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 170, 255, 0.2);
	border-radius: 8px;
	padding: 16px;
	transition: all 0.3s ease;
	text-decoration: none;
	color: inherit;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.vaultCard:hover {
	border-color: rgba(0, 170, 255, 0.4);
	box-shadow: 0 0 20px rgba(0, 170, 255, 0.2);
	transform: translateY(-2px);
}

.vaultHeader {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.vaultMetrics {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.metric {
	display: flex;
	flex-direction: column;
	gap: 2px;
	text-align: center;
}

.healthBar {
	height: 4px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 2px;
	overflow: hidden;
}

.healthFill {
	height: 100%;
	transition: width 0.5s ease;
	border-radius: 2px;
}

@media (max-width: 768px) {
	.vaultGrid {
		grid-template-columns: 1fr;
	}
}
</style>