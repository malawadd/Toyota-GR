import { ref, computed } from "vue"
import { defineStore } from "pinia"
import {
	fetchVehicles,
	fetchStatisticsOverview,
	fetchWeatherSummary,
	fetchFastestLaps,
	fetchSectionLeaders
} from "@/services/api/racing"

export const useRacingStore = defineStore("racing", () => {
	const vehicles = ref([])
	const statistics = ref(null)
	const weather = ref(null)
	const fastestLaps = ref([])
	const sectionLeaders = ref(null)
	const loading = ref(false)
	const error = ref(null)

	const vehiclesByClass = computed(() => {
		const grouped = { Pro: [], Am: [] }
		vehicles.value.forEach(vehicle => {
			if (grouped[vehicle.class]) {
				grouped[vehicle.class].push(vehicle)
			}
		})
		return grouped
	})

	const totalVehicles = computed(() => vehicles.value.length)

	const loadInitialData = async () => {
		loading.value = true
		error.value = null

		try {
			const [
				vehiclesData,
				statsData,
				weatherData,
				fastestData,
				leadersData
			] = await Promise.all([
				fetchVehicles(),
				fetchStatisticsOverview(),
				fetchWeatherSummary(),
				fetchFastestLaps({ limit: 10 }),
				fetchSectionLeaders()
			])

			vehicles.value = vehiclesData.data || []
			statistics.value = statsData.data || null
			weather.value = weatherData.data || null
			fastestLaps.value = fastestData.data || []
			sectionLeaders.value = leadersData.data || null

		} catch (err) {
			console.error('Failed to load racing data:', err)
			error.value = err.message
		} finally {
			loading.value = false
		}
	}

	const refreshData = async () => {
		await loadInitialData()
	}

	return {
		vehicles,
		statistics,
		weather,
		fastestLaps,
		sectionLeaders,
		loading,
		error,
		vehiclesByClass,
		totalVehicles,
		loadInitialData,
		refreshData
	}
})
