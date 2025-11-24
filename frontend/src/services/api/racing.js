import { fetchFromAPI } from '@/services/config'

export const fetchHealth = async () => {
	return fetchFromAPI('/health')
}

export const fetchVehicles = async (options = {}) => {
	return fetchFromAPI('/vehicles', { params: options })
}

export const fetchVehicleById = async (vehicleId) => {
	return fetchFromAPI(`/vehicles/${vehicleId}`)
}

export const fetchVehicleByNumber = async (carNumber) => {
	return fetchFromAPI(`/vehicles/by-number/${carNumber}`)
}

export const fetchTelemetry = async (vehicleId, options = {}) => {
	return fetchFromAPI('/telemetry', {
		params: { vehicleId, ...options }
	})
}

export const fetchTelemetryForLap = async (vehicleId, lap, options = {}) => {
	return fetchFromAPI(`/telemetry/vehicle/${vehicleId}/lap/${lap}`, { params: options })
}

export const fetchTelemetryStats = async (vehicleId, lap = null) => {
	const params = lap ? { lap } : {}
	return fetchFromAPI(`/telemetry/vehicle/${vehicleId}/stats`, { params })
}

export const fetchLapTimes = async (options = {}) => {
	return fetchFromAPI('/lap-times', { params: options })
}

export const fetchLapTimesForVehicle = async (vehicleId, options = {}) => {
	return fetchFromAPI(`/lap-times/vehicle/${vehicleId}`, { params: options })
}

export const fetchFastestLaps = async (options = {}) => {
	return fetchFromAPI('/lap-times/fastest', { params: options })
}

export const fetchLapComparison = async (vehicleIds, options = {}) => {
	return fetchFromAPI('/lap-times/compare', {
		params: { vehicleIds: vehicleIds.join(','), ...options }
	})
}

export const fetchRaceResults = async (options = {}) => {
	return fetchFromAPI('/results', { params: options })
}

export const fetchResultForVehicle = async (vehicleId) => {
	return fetchFromAPI(`/results/vehicle/${vehicleId}`)
}

export const fetchResultsByClass = async (vehicleClass, options = {}) => {
	return fetchFromAPI(`/results/class/${vehicleClass}`, { params: options })
}

export const fetchSectionTimes = async (options = {}) => {
	return fetchFromAPI('/sections', { params: options })
}

export const fetchSectionTimesForVehicle = async (vehicleId, options = {}) => {
	return fetchFromAPI(`/sections/vehicle/${vehicleId}`, { params: options })
}

export const fetchSectionTimesForLap = async (vehicleId, lap) => {
	return fetchFromAPI(`/sections/vehicle/${vehicleId}/lap/${lap}`)
}

export const fetchSectionLeaders = async (options = {}) => {
	return fetchFromAPI('/sections/leaders', { params: options })
}

export const fetchWeather = async (options = {}) => {
	return fetchFromAPI('/weather', { params: options })
}

export const fetchWeatherRange = async (startTime, endTime, options = {}) => {
	return fetchFromAPI('/weather/range', {
		params: { startTime, endTime, ...options }
	})
}

export const fetchWeatherSummary = async (options = {}) => {
	return fetchFromAPI('/weather/summary', { params: options })
}

export const fetchRainPeriods = async (minRain = 0) => {
	return fetchFromAPI('/weather/rain', { params: { minRain } })
}

export const fetchWeatherAtTime = async (time) => {
	return fetchFromAPI('/weather/at-time', { params: { time } })
}

export const fetchStatisticsOverview = async () => {
	return fetchFromAPI('/statistics/overview')
}

export const fetchVehicleStatistics = async (vehicleId) => {
	return fetchFromAPI(`/statistics/vehicle/${vehicleId}`)
}

export const fetchLeaderboard = async (options = {}) => {
	return fetchFromAPI('/statistics/leaderboard', { params: options })
}
