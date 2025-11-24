<script setup>
import { computed } from "vue"

const props = defineProps({
	event: Object,
	type: String,
	index: Number
})

const formatAmount = (amount) => {
	const num = parseFloat(amount) / 1e18
	if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
	if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
	return num.toFixed(4)
}

const formatAddress = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`

const cardConfig = computed(() => {
	switch (props.type) {
		case 'deposit':
			return {
				title: 'DEPOSIT',
				color: 'green',
				icon: 'coins',
				gradient: 'rgba(0, 255, 157, 0.1)',
				border: 'rgba(0, 255, 157, 0.3)',
				fields: [
					{ label: 'SENDER', value: formatAddress(props.event.sender) },
					{ label: 'OWNER', value: formatAddress(props.event.owner) },
					{ label: 'ASSETS', value: formatAmount(props.event.assets) },
					{ label: 'SHARES', value: formatAmount(props.event.shares) }
				]
			}
		case 'borrow':
			return {
				title: 'BORROW',
				color: 'orange',
				icon: 'blob',
				gradient: 'rgba(255, 102, 0, 0.1)',
				border: 'rgba(255, 102, 0, 0.3)',
				fields: [
					{ label: 'ACCOUNT', value: formatAddress(props.event.account) },
					{ label: 'ASSETS', value: formatAmount(props.event.assets) },
					{ label: 'VAULT', value: formatAddress(props.event.vault) }
				]
			}
		case 'liquidate':
			return {
				title: 'LIQUIDATION',
				color: 'red',
				icon: 'zap',
				gradient: 'rgba(255, 0, 64, 0.1)',
				border: 'rgba(255, 0, 64, 0.3)',
				fields: [
					{ label: 'LIQUIDATOR', value: formatAddress(props.event.liquidator) },
					{ label: 'VIOLATOR', value: formatAddress(props.event.violator) },
					{ label: 'REPAY ASSETS', value: formatAmount(props.event.repayAssets) },
					{ label: 'YIELD BALANCE', value: formatAmount(props.event.yieldBalance) }
				]
			}
		case 'transfer':
			return {
				title: 'TRANSFER',
				color: 'blue',
				icon: 'arrow-top-right',
				gradient: 'rgba(0, 170, 255, 0.1)',
				border: 'rgba(0, 170, 255, 0.3)',
				fields: [
					{ label: 'FROM', value: formatAddress(props.event.from) },
					{ label: 'TO', value: formatAddress(props.event.to) },
					{ label: 'VALUE', value: formatAmount(props.event.value) }
				]
			}
		case 'swap':
			return {
				title: 'SWAP',
				color: 'purple',
				icon: 'arrow-top-right',
				gradient: 'rgba(255, 0, 255, 0.1)',
				border: 'rgba(255, 0, 255, 0.3)',
				fields: [
					{ label: 'SENDER', value: formatAddress(props.event.sender) },
					{ label: 'AMOUNT IN', value: formatAmount(props.event.amount0In || props.event.amount1In) },
					{ label: 'AMOUNT OUT', value: formatAmount(props.event.amount0Out || props.event.amount1Out) },
					{ label: 'POOL', value: formatAddress(props.event.pool) }
				]
			}
		default:
			return {
				title: 'EVENT',
				color: 'secondary',
				icon: 'check',
				gradient: 'rgba(255, 255, 255, 0.05)',
				border: 'rgba(255, 255, 255, 0.1)',
				fields: []
			}
	}
})
</script>

<template>
	<div 
		:class="$style.card"
		:style="{ 
			background: `linear-gradient(135deg, ${cardConfig.gradient} 0%, rgba(0, 0, 0, 0.8) 100%)`,
			borderColor: cardConfig.border,
			animationDelay: `${index * 0.1}s`
		}"
	>
		<div :class="$style.header">
			<Flex align="center" gap="8">
				<div :class="$style.iconWrapper" :style="{ borderColor: cardConfig.border }">
					<Icon :name="cardConfig.icon" size="16" :color="cardConfig.color" />
				</div>
				<Text size="12" weight="700" :color="cardConfig.color">{{ cardConfig.title }}</Text>
			</Flex>
			
			<div :class="$style.pulse" :style="{ background: cardConfig.border }" />
		</div>
		
		<div :class="$style.content">
			<div
				v-for="(field, fieldIndex) in cardConfig.fields"
				:key="fieldIndex"
				:class="$style.field"
			>
				<Text size="10" weight="600" color="tertiary">{{ field.label }}</Text>
				<Text size="12" weight="600" color="secondary" mono>{{ field.value }}</Text>
			</div>
		</div>
	</div>
</template>

<style module>
.card {
	border: 1px solid;
	border-radius: 8px;
	padding: 16px;
	transition: all 0.3s ease;
	animation: slideInUp 0.5s ease forwards;
	opacity: 0;
	transform: translateY(20px);
	position: relative;
	overflow: hidden;
}

@keyframes slideInUp {
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.iconWrapper {
	width: 28px;
	height: 28px;
	border: 1px solid;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.6);
}

.pulse {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% { 
		opacity: 1;
		transform: scale(1);
	}
	50% { 
		opacity: 0.5;
		transform: scale(1.2);
	}
}

.content {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 4px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.field:last-child {
	border-bottom: none;
}
</style>