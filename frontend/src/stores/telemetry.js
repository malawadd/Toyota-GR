import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTelemetry, fetchTelemetryForLap } from '@/services/api/racing'

export const useTelemetryStore = defineStore('telemetry', () => {
	const selectedVehicleId = ref(null)
	const telemetryData = ref([])
	const currentMode = ref('live')
	const isPlaying = ref(false)
	const playbackSpeed = ref(1)
	const currentReplayIndex = ref(0)
	const selectedLap = ref(null)
	const replayData = ref([])
	const loading = ref(false)
	const error = ref(null)

	let pollingInterval = null
	let replayInterval = null

	// Helper to transform flat API data into structured objects grouped by timestamp
	const transformTelemetryData = (data) => {
		if (!Array.isArray(data)) return []

		const grouped = {}
		
		data.forEach(item => {
			const timestamp = item.timestamp
			if (!grouped[timestamp]) {
				grouped[timestamp] = {
					timestamp,
					lap: item.lap,
					vehicleId: item.vehicle_id
				}
			}

			// Map telemetry names to frontend properties
			const value = item.telemetry_value
			switch (item.telemetry_name) {
				case 'speed_can':
				case 'gps_speed':
					grouped[timestamp].speed = value
					break
				case 'eng_rpm':
				case 'rpm':
					grouped[timestamp].rpm = value
					break
				case 'ath':
				case 'throttle_pos':
					grouped[timestamp].throttle = value
					break
				case 'pbrake_f':
				case 'brake_pos':
					grouped[timestamp].brake = value
					break
				case 'Steering_Angle':
				case 'steering_angle':
					grouped[timestamp].steering = value
					break
				case 'gear':
					grouped[timestamp].gear = value
					break
			}
		})

		// Convert to array and sort by timestamp
		return Object.values(grouped).sort((a, b) => 
			new Date(a.timestamp) - new Date(b.timestamp)
		)
	}

	const currentTelemetry = computed(() => {
		if (currentMode.value === 'live') {
			return telemetryData.value[telemetryData.value.length - 1] || null
		} else {
			return replayData.value[currentReplayIndex.value] || null
		}
	})

	const replayProgress = computed(() => {
		if (!replayData.value.length) return 0
		return (currentReplayIndex.value / (replayData.value.length - 1)) * 100
	})

	const startLiveMode = async (vehicleId) => {
		stopReplay()
		selectedVehicleId.value = vehicleId
		currentMode.value = 'live'

		await fetchLatestTelemetry()

		if (pollingInterval) clearInterval(pollingInterval)
		pollingInterval = setInterval(fetchLatestTelemetry, 3000)
	}

	const stopLiveMode = () => {
		if (pollingInterval) {
			clearInterval(pollingInterval)
			pollingInterval = null
		}
	}

	const fetchLatestTelemetry = async () => {
		if (!selectedVehicleId.value) return

		try {
			loading.value = true
			error.value = null
			// Fetch more data points to ensure we get a good chunk of history for the chart
			const result = await fetchTelemetry(selectedVehicleId.value, { limit: 500 })
			telemetryData.value = transformTelemetryData(result.data || [])
		} catch (err) {
			error.value = err.message
			console.error('Failed to fetch telemetry:', err)
		} finally {
			loading.value = false
		}
	}

	const startReplay = async (vehicleId, lap) => {
		stopLiveMode()
		selectedVehicleId.value = vehicleId
		selectedLap.value = lap
		currentMode.value = 'replay'
		currentReplayIndex.value = 0

		try {
			loading.value = true
			error.value = null
			const result = await fetchTelemetryForLap(vehicleId, lap)
			replayData.value = transformTelemetryData(result.data || [])

			if (replayData.value.length > 0) {
				isPlaying.value = true
				startReplayLoop()
			}
		} catch (err) {
			error.value = err.message
			console.error('Failed to fetch replay data:', err)
		} finally {
			loading.value = false
		}
	}

	const startReplayLoop = () => {
		if (replayInterval) clearInterval(replayInterval)

		const baseInterval = 100
		const interval = baseInterval / playbackSpeed.value

		replayInterval = setInterval(() => {
			if (!isPlaying.value) return

			currentReplayIndex.value++

			if (currentReplayIndex.value >= replayData.value.length) {
				currentReplayIndex.value = 0
			}
		}, interval)
	}

	const pauseReplay = () => {
		isPlaying.value = false
		if (replayInterval) {
			clearInterval(replayInterval)
			replayInterval = null
		}
	}

	const resumeReplay = () => {
		if (currentMode.value !== 'replay' || !replayData.value.length) return
		isPlaying.value = true
		startReplayLoop()
	}

	const stopReplay = () => {
		pauseReplay()
		currentReplayIndex.value = 0
		replayData.value = []
		selectedLap.value = null
	}

	const seekReplay = (percentage) => {
		if (!replayData.value.length) return
		const index = Math.floor((percentage / 100) * (replayData.value.length - 1))
		currentReplayIndex.value = Math.max(0, Math.min(index, replayData.value.length - 1))
	}

	const setPlaybackSpeed = (speed) => {
		playbackSpeed.value = speed
		if (isPlaying.value) {
			startReplayLoop()
		}
	}

	const skipToStart = () => {
		currentReplayIndex.value = 0
	}

	const skipToEnd = () => {
		if (replayData.value.length > 0) {
			currentReplayIndex.value = replayData.value.length - 1
		}
	}

	const reset = () => {
		stopLiveMode()
		stopReplay()
		selectedVehicleId.value = null
		telemetryData.value = []
		currentMode.value = 'live'
		error.value = null
	}

	return {
		selectedVehicleId,
		telemetryData,
		currentMode,
		isPlaying,
		playbackSpeed,
		currentReplayIndex,
		selectedLap,
		replayData,
		loading,
		error,
		currentTelemetry,
		replayProgress,
		startLiveMode,
		stopLiveMode,
		fetchLatestTelemetry,
		startReplay,
		pauseReplay,
		resumeReplay,
		stopReplay,
		seekReplay,
		setPlaybackSpeed,
		skipToStart,
		skipToEnd,
		reset
	}
})
