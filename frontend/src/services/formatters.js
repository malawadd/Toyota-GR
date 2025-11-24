export const formatLapTime = (milliseconds) => {
	if (!milliseconds) return '--:--.---'

	const totalSeconds = milliseconds / 1000
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = Math.floor(totalSeconds % 60)
	const ms = Math.floor((milliseconds % 1000))

	return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

export const formatSpeed = (speed) => {
	if (speed === null || speed === undefined) return '--'
	return `${speed.toFixed(1)} km/h`
}

export const formatVehicleId = (vehicleId) => {
	if (!vehicleId) return 'N/A'
	return vehicleId
}

export const formatCarNumber = (carNumber) => {
	if (!carNumber) return '--'
	return `#${carNumber}`
}

export const formatGap = (gap) => {
	if (!gap || gap === '0:00.000') return '-'
	return gap
}

export const formatPosition = (position) => {
	if (!position) return '--'
	const suffix = ['st', 'nd', 'rd'][((position + 90) % 100 - 10) % 10 - 1] || 'th'
	return `${position}${suffix}`
}

export const formatPercentage = (value) => {
	if (value === null || value === undefined) return '--'
	return `${value.toFixed(1)}%`
}

export const formatTemperature = (temp) => {
	if (temp === null || temp === undefined) return '--'
	return `${temp.toFixed(1)}°C`
}

export const formatPressure = (pressure) => {
	if (pressure === null || pressure === undefined) return '--'
	return `${pressure.toFixed(2)} hPa`
}

export const formatWindSpeed = (speed) => {
	if (speed === null || speed === undefined) return '--'
	return `${speed.toFixed(1)} m/s`
}

export const formatWindDirection = (degrees) => {
	if (degrees === null || degrees === undefined) return '--'
	const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
	const index = Math.round(((degrees % 360) / 45)) % 8
	return directions[index]
}

export const formatTimestamp = (timestamp) => {
	if (!timestamp) return '--'
	const date = new Date(timestamp)
	return date.toLocaleTimeString('en-US', { hour12: false })
}

export const formatSectionTime = (seconds) => {
	if (seconds === null || seconds === undefined) return '--'
	return `${seconds.toFixed(3)}s`
}

export const calculateGapFromFirst = (lapTime, fastestLapTime) => {
	if (!lapTime || !fastestLapTime) return null
	const diff = lapTime - fastestLapTime
	if (diff === 0) return '0:00.000'

	const seconds = Math.floor(diff / 1000)
	const ms = diff % 1000
	return `+${seconds}:${(diff % 60000 / 1000).toFixed(3).padStart(6, '0')}`
}

export const formatRPM = (rpm) => {
	if (rpm === null || rpm === undefined) return '--'
	return rpm.toLocaleString('en-US')
}

export const formatGear = (gear) => {
	if (gear === null || gear === undefined) return '-'
	if (gear === 0) return 'N'
	if (gear === -1) return 'R'
	return gear.toString()
}

export const getClassColor = (vehicleClass) => {
	const colors = {
		'Pro': 'var(--neon-cyan)',
		'Am': 'var(--neon-magenta)',
		'default': 'var(--txt-secondary)'
	}
	return colors[vehicleClass] || colors.default
}

export const getTelemetryColor = (telemetryName) => {
	const colors = {
		'speed_can': 'var(--neon-cyan)',
		'rpm': 'var(--neon-magenta)',
		'throttle_pos': 'var(--neon-lime)',
		'brake_pos': 'var(--red)',
		'gear': 'var(--yellow)',
		'steering_angle': 'var(--purple)'
	}
	return colors[telemetryName] || 'var(--txt-primary)'
}
