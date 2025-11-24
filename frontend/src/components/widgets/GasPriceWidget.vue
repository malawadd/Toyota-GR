<script setup>
import { ref, onMounted, watch } from 'vue'
import { fetchCashFlows } from '@/services/api/euler'
import { useAppStore } from "@/stores/app"

const appStore = useAppStore()

const deposits     = ref(0n)
const withdraws    = ref(0n)
const netFlow      = ref(0n)

const load = async () => {
  const since = (Date.now()/1000 - 86400).toFixed(0)  // 24 h ago (string)
  const data  = await fetchCashFlows(since)

  deposits.value  = data.deposits
    .reduce((s, d) => s + BigInt(d.assets), 0n)

  withdraws.value = data.withdraws
    .reduce((s, w) => s + BigInt(w.assets), 0n)

  netFlow.value   = deposits.value - withdraws.value
}
onMounted(load)
watch(() => appStore.network, load)

const fmt = (wei) =>
  (Number(wei) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })


</script>

<template>
  <Flex direction="column" gap="20" :class="$style.wrapper">
    <Text size="16" weight="500" color="primary">Cash Flow (24 h)</Text>

    <Flex justify="between">
      <Text size="13" color="tertiary">Deposits</Text>
      <Text mono weight="600" color="primary">+{{ fmt(deposits) }}</Text>
    </Flex>

    <Flex justify="between">
      <Text size="13" color="tertiary">Withdraws</Text>
      <Text mono weight="600" color="red">-{{ fmt(withdraws) }}</Text>
    </Flex>

    <Flex justify="between" :class="$style.net">
      <Text size="13" color="primary">Net Flow</Text>
      <Text mono weight="600"
            :color="netFlow >= 0n ? 'primary' : 'red'">
        {{ netFlow >= 0n ? '+' : '-' }}{{ fmt(netFlow < 0n ? -netFlow : netFlow) }}
      </Text>
    </Flex>
  </Flex>
</template>

<style module>
.wrapper { min-height: 220px; background: var(--card-background); padding: 20px; }
.net { border-top: 1px solid var(--op-10); padding-top: 10px; }
</style>
