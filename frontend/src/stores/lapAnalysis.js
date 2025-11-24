import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchLapTimes } from '@/services/api/racing'

export const useLapAnalysisStore = defineStore('lapAnalysis', () => {
	const lapData = ref([])
	const selectedVehicleIds = ref([])
	const classFilter = ref('all')
	const loading = ref(false)
	const error = ref(null)

	const filteredLapData = computed(() => {
		let filtered = lapData.value

		if (selectedVehicleIds.value.length > 0) {
			filtered = filtered.filter(lap =>
				selectedVehicleIds.value.includes(lap.vehicleId)
			)
		}

		if (classFilter.value !== 'all') {
			filtered = filtered.filter(lap =>
				lap.class?.toLowerCase() === classFilter.value.toLowerCase()
			)
		}

		return filtered
	})

	const vehicleStats = computed(() => {
		const stats = {}

		selectedVehicleIds.value.forEach(vehicleId => {
			const vehicleLaps = filteredLapData.value.filter(lap => lap.vehicleId === vehicleId)

			if (vehicleLaps.length === 0) {
				stats[vehicleId] = null
				return
			}

			const times = vehicleLaps.map(lap => lap.lapTime).filter(t => t != null)
			const fastest = Math.min(...times)
			const average = times.reduce((a, b) => a + b, 0) / times.length

			stats[vehicleId] = {
				totalLaps: vehicleLaps.length,
				fastestLap: fastest,
				averageLap: average,
				laps: vehicleLaps.sort((a, b) => a.lap - b.lap)
			}
		})

		return stats
	})

	const overallStats = computed(() => {
		if (filteredLapData.value.length === 0) {
			return {
				totalLaps: 0,
				fastestLap: 0,
				averageLap: 0
			}
		}

		const times = filteredLapData.value.map(lap => lap.lapTime).filter(t => t != null)

		return {
			totalLaps: filteredLapData.value.length,
			fastestLap: times.length > 0 ? Math.min(...times) : 0,
			averageLap: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
		}
	})

	const loadLapData = async (options = {}) => {
		try {
			loading.value = true
			error.value = null
			const result = await fetchLapTimes(options)
			lapData.value = result.data || []
		} catch (err) {
			error.value = err.message
			console.error('Failed to load lap data:', err)
		} finally {
			loading.value = false
		}
	}

	const toggleVehicle = (vehicleId) => {
		const index = selectedVehicleIds.value.indexOf(vehicleId)
		if (index > -1) {
			selectedVehicleIds.value.splice(index, 1)
		} else {
			selectedVehicleIds.value.push(vehicleId)
		}
	}

	const setVehicles = (vehicleIds) => {
		selectedVehicleIds.value = vehicleIds
	}

	const setClassFilter = (classValue) => {
		classFilter.value = classValue
	}

	const reset = () => {
		lapData.value = []
		selectedVehicleIds.value = []
		classFilter.value = 'all'
		error.value = null
	}

	return {
		lapData,
		selectedVehicleIds,
		classFilter,
		loading,
		error,
		filteredLapData,
		vehicleStats,
		overallStats,
		loadLapData,
		toggleVehicle,
		setVehicles,
		setClassFilter,
		reset
	}
})
