<script>
import { ref, onMounted, watch, defineComponent } from "vue"
import { fetchLatestTransactions } from "@/services/api/euler"
import { useAppStore } from "@/stores/app"

export default defineComponent({
	name: 'LendingOverview',
	setup() {
		const appStore = useAppStore()
		const deposits = ref([])
		const borrows = ref([])
		const withdraws = ref([])

		const formatAmount = (amount) => {
			const num = parseFloat(amount) / 1e18
			if (num > 1e9) return `${(num/1e9).toFixed(2)}B`
			if (num > 1e6) return `${(num/1e6).toFixed(2)}M`
			if (num > 1e3) return `${(num/1e3).toFixed(2)}K`
			return num.toFixed(2)
		}

		const loadData = async () => {
			try {
				const data = await fetchLatestTransactions(100)
				deposits.value = data.deposits || []
				borrows.value = data.borrows || []
				withdraws.value = data.withdraws || []
			} catch (error) {
				console.error('Failed to load lending data:', error)
			}
		}

		onMounted(loadData)
		watch(() => appStore.network, loadData)

		return {
			deposits,
			borrows,
			withdraws,
			formatAmount
		}
	}
})
</script>

<template>
	<div :class="$style.container">
		<Flex direction="column" gap="24">
			<Text size="24" weight="700" color="primary">LENDING PROTOCOL OVERVIEW</Text>

			<div :class="$style.grid">
				<div :class="$style.depositCard">
					<Text size="14" weight="600" color="green">TOTAL DEPOSITS</Text>
					<Text size="32" weight="700" color="green" mono>{{ deposits.length }}</Text>
					<Text size="12" weight="500" color="tertiary">
						{{ formatAmount(deposits.reduce((acc, d) => acc + parseFloat(d.assets), 0).toString()) }} TOTAL
					</Text>
				</div>

				<div :class="$style.borrowCard">
					<Text size="14" weight="600" color="orange">TOTAL BORROWS</Text>
					<Text size="32" weight="700" color="orange" mono>{{ borrows.length }}</Text>
					<Text size="12" weight="500" color="tertiary">
						{{ formatAmount(borrows.reduce((acc, b) => acc + parseFloat(b.assets), 0).toString()) }} TOTAL
					</Text>
				</div>

				<div :class="$style.withdrawCard">
					<Text size="14" weight="600" color="red">WITHDRAWALS</Text>
					<Text size="32" weight="700" color="red" mono>{{ withdraws.length }}</Text>
					<Text size="12" weight="500" color="tertiary">
						{{ formatAmount(withdraws.reduce((acc, w) => acc + parseFloat(w.assets), 0).toString()) }} TOTAL
					</Text>
				</div>
			</div>

			<div :class="$style.activityGrid">
				<div :class="$style.activityCard">
					<Text size="16" weight="700" color="green">RECENT DEPOSITS</Text>
					<div :class="$style.activityList">
						<div v-for="deposit in deposits.slice(0, 8)" :key="deposit.id" :class="$style.activityItem">
							<router-link :to="`/dashboard/transaction/${deposit.transactionHash}`" :class="$style.txLink">
								<Text size="12" weight="600" color="secondary" mono>
									{{ deposit.sender.slice(0, 8) }}...
								</Text>
							</router-link>
							<Text size="12" weight="600" color="green" mono>
								+{{ formatAmount(deposit.assets) }}
							</Text>
						</div>
					</div>
				</div>

				<div :class="$style.activityCard">
					<Text size="16" weight="700" color="orange">RECENT BORROWS</Text>
					<div :class="$style.activityList">
						<div v-for="borrow in borrows.slice(0, 8)" :key="borrow.id" :class="$style.activityItem">
							<router-link :to="`/dashboard/transaction/${borrow.transactionHash}`" :class="$style.txLink">
								<Text size="12" weight="600" color="secondary" mono>
									{{ borrow.account.slice(0, 8) }}...
								</Text>
							</router-link>
							<Text size="12" weight="600" color="orange" mono>
								{{ formatAmount(borrow.assets) }}
							</Text>
						</div>
					</div>
				</div>
			</div>
		</Flex>
	</div>
</template>

<style module>
.container {
	max-width: 1400px;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 20px;
}

.depositCard {
	background: linear-gradient(135deg, rgba(0, 255, 157, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(0, 255, 157, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.borrowCard {
	background: linear-gradient(135deg, rgba(255, 165, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 165, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.withdrawCard {
	background: linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%);
	border: 1px solid rgba(255, 0, 0, 0.3);
	border-radius: 8px;
	padding: 24px;
}

.activityGrid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px;
}

.activityCard {
	background: rgba(0, 0, 0, 0.6);
	border: 1px solid rgba(0, 255, 255, 0.2);
	border-radius: 8px;
	padding: 20px;
}

.activityList {
	margin-top: 16px;
	max-height: 300px;
	overflow-y: auto;
}

.activityItem {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
	.activityGrid {
		grid-template-columns: 1fr;
	}
}

.txLink {
	text-decoration: none;
	color: inherit;
}

.txLink:hover {
	opacity: 0.8;
}
</style>