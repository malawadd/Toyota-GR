/**
 * Lap Analysis Utilities
 * Provides comprehensive analysis of lap telemetry data
 */

/**
 * Calculate comprehensive lap statistics
 * @param {Array} telemetryData - Array of telemetry data points
 * @returns {Object} Lap statistics
 */
export function calculateLapStats(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) {
        return null
    }

    const speeds = telemetryData.map(d => d.speed).filter(Boolean)
    const throttles = telemetryData.map(d => d.throttle).filter(Boolean)
    const brakes = telemetryData.map(d => d.brake).filter(Boolean)
    const rpms = telemetryData.map(d => d.rpm).filter(Boolean)
    const steerings = telemetryData.map(d => d.steering).filter(Boolean)

    return {
        maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
        avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        minSpeed: speeds.length > 0 ? Math.min(...speeds) : 0,
        maxRPM: rpms.length > 0 ? Math.max(...rpms) : 0,
        avgRPM: rpms.length > 0 ? rpms.reduce((a, b) => a + b, 0) / rpms.length : 0,
        maxThrottle: throttles.length > 0 ? Math.max(...throttles) : 0,
        avgThrottle: throttles.length > 0 ? throttles.reduce((a, b) => a + b, 0) / throttles.length : 0,
        maxBrake: brakes.length > 0 ? Math.max(...brakes) : 0,
        avgBrake: brakes.length > 0 ? brakes.reduce((a, b) => a + b, 0) / brakes.length : 0,
        maxSteering: steerings.length > 0 ? Math.max(...steerings.map(Math.abs)) : 0,
        dataPoints: telemetryData.length
    }
}

/**
 * Compare two laps and calculate differences
 * @param {Array} lap1Data - First lap telemetry
 * @param {Array} lap2Data - Second lap telemetry
 * @returns {Object} Comparison results
 */
export function compareLaps(lap1Data, lap2Data) {
    const stats1 = calculateLapStats(lap1Data)
    const stats2 = calculateLapStats(lap2Data)

    if (!stats1 || !stats2) return null

    return {
        speedDiff: {
            max: stats2.maxSpeed - stats1.maxSpeed,
            avg: stats2.avgSpeed - stats1.avgSpeed
        },
        throttleDiff: {
            avg: stats2.avgThrottle - stats1.avgThrottle
        },
        brakeDiff: {
            avg: stats2.avgBrake - stats1.avgBrake
        },
        rpmDiff: {
            max: stats2.maxRPM - stats1.maxRPM,
            avg: stats2.avgRPM - stats1.avgRPM
        }
    }
}

/**
 * Identify braking zones in telemetry data
 * @param {Array} telemetryData - Telemetry data
 * @returns {Array} Braking zones
 */
export function identifyBrakingZones(telemetryData) {
    const brakingZones = []
    let inBrakingZone = false
    let zoneStart = null
    let zoneData = []

    telemetryData.forEach((point, index) => {
        const isBraking = point.brake && point.brake > 10

        if (isBraking && !inBrakingZone) {
            // Start of braking zone
            inBrakingZone = true
            zoneStart = index
            zoneData = [point]
        } else if (isBraking && inBrakingZone) {
            // Continue braking zone
            zoneData.push(point)
        } else if (!isBraking && inBrakingZone) {
            // End of braking zone
            inBrakingZone = false

            if (zoneData.length > 3) { // Only consider significant braking zones
                const maxBrake = Math.max(...zoneData.map(d => d.brake || 0))
                const speedBefore = telemetryData[zoneStart - 1]?.speed || 0
                const speedAfter = point.speed || 0

                brakingZones.push({
                    startIndex: zoneStart,
                    endIndex: index - 1,
                    duration: zoneData.length,
                    maxBrake,
                    speedBefore,
                    speedAfter,
                    speedReduction: speedBefore - speedAfter
                })
            }

            zoneData = []
        }
    })

    return brakingZones
}

/**
 * Identify corners based on steering input
 * @param {Array} telemetryData - Telemetry data
 * @returns {Array} Identified corners
 */
export function identifyCorners(telemetryData) {
    const corners = []
    let inCorner = false
    let cornerStart = null
    let cornerData = []

    telemetryData.forEach((point, index) => {
        const isCorner = point.steering && Math.abs(point.steering) > 15

        if (isCorner && !inCorner) {
            inCorner = true
            cornerStart = index
            cornerData = [point]
        } else if (isCorner && inCorner) {
            cornerData.push(point)
        } else if (!isCorner && inCorner) {
            inCorner = false

            if (cornerData.length > 5) {
                const speeds = cornerData.map(d => d.speed || 0)
                const entrySpeed = cornerData[0]?.speed || 0
                const apexSpeed = Math.min(...speeds)
                const exitSpeed = cornerData[cornerData.length - 1]?.speed || 0
                const apexIndex = speeds.indexOf(apexSpeed)

                // Find braking point (before corner)
                let brakingPoint = null
                for (let i = cornerStart - 1; i >= Math.max(0, cornerStart - 20); i--) {
                    if (telemetryData[i]?.brake > 10) {
                        brakingPoint = i
                        break
                    }
                }

                // Find throttle application point
                let throttlePoint = null
                for (let i = 0; i < cornerData.length; i++) {
                    if (cornerData[i]?.throttle > 50) {
                        throttlePoint = cornerStart + i
                        break
                    }
                }

                corners.push({
                    name: `Corner ${corners.length + 1}`,
                    startIndex: cornerStart,
                    endIndex: cornerStart + cornerData.length - 1,
                    apexIndex: cornerStart + apexIndex,
                    entrySpeed,
                    apexSpeed,
                    exitSpeed,
                    brakingPoint,
                    throttlePoint,
                    duration: cornerData.length
                })
            }

            cornerData = []
        }
    })

    return corners
}

/**
 * Calculate consistency score based on lap data
 * @param {Array} laps - Array of lap telemetry data
 * @returns {Object} Consistency metrics
 */
export function calculateConsistency(laps) {
    if (!laps || laps.length < 2) return null

    const lapStats = laps.map(calculateLapStats).filter(Boolean)

    const speedVariances = calculateVariance(lapStats.map(s => s.avgSpeed))
    const throttleVariances = calculateVariance(lapStats.map(s => s.avgThrottle))
    const brakeVariances = calculateVariance(lapStats.map(s => s.avgBrake))

    // Consistency score: lower variance = higher score
    const consistencyScore = Math.max(0, 100 - (speedVariances + throttleVariances + brakeVariances) / 3)

    return {
        score: consistencyScore,
        speedVariance: speedVariances,
        throttleVariance: throttleVariances,
        brakeVariance: brakeVariances
    }
}

/**
 * Calculate variance of an array
 */
function calculateVariance(arr) {
    if (arr.length === 0) return 0
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
    return Math.sqrt(variance)
}

/**
 * Calculate braking efficiency
 * @param {Array} telemetryData - Telemetry data
 * @returns {Object} Braking efficiency metrics
 */
export function calculateBrakingEfficiency(telemetryData) {
    const brakingZones = identifyBrakingZones(telemetryData)

    if (brakingZones.length === 0) return null

    const avgBrakeForce = brakingZones.reduce((sum, zone) => sum + zone.maxBrake, 0) / brakingZones.length
    const avgSpeedReduction = brakingZones.reduce((sum, zone) => sum + zone.speedReduction, 0) / brakingZones.length

    // Efficiency: higher speed reduction with less brake force is better
    const efficiency = (avgSpeedReduction / avgBrakeForce) * 100

    return {
        efficiency: Math.min(100, efficiency),
        avgBrakeForce,
        avgSpeedReduction,
        brakingZoneCount: brakingZones.length
    }
}

/**
 * Calculate throttle application efficiency
 * @param {Array} telemetryData - Telemetry data
 * @returns {Object} Throttle efficiency metrics
 */
export function calculateThrottleEfficiency(telemetryData) {
    const corners = identifyCorners(telemetryData)

    if (corners.length === 0) return null

    let earlyThrottleCount = 0
    let lateThrottleCount = 0

    corners.forEach(corner => {
        if (corner.throttlePoint && corner.apexIndex) {
            const throttleRelativeToApex = corner.throttlePoint - corner.apexIndex
            if (throttleRelativeToApex < 0) {
                earlyThrottleCount++
            } else if (throttleRelativeToApex > 5) {
                lateThrottleCount++
            }
        }
    })

    return {
        earlyThrottlePercent: (earlyThrottleCount / corners.length) * 100,
        lateThrottlePercent: (lateThrottleCount / corners.length) * 100,
        optimalThrottlePercent: ((corners.length - earlyThrottleCount - lateThrottleCount) / corners.length) * 100
    }
}

/**
 * Calculate sector times (divide lap into 3 sectors)
 * @param {Array} telemetryData - Telemetry data
 * @returns {Array} Sector times
 */
export function calculateSectorTimes(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) return []

    const sectorSize = Math.floor(telemetryData.length / 3)
    const sectors = []

    for (let i = 0; i < 3; i++) {
        const start = i * sectorSize
        const end = i === 2 ? telemetryData.length : (i + 1) * sectorSize
        const sectorData = telemetryData.slice(start, end)

        sectors.push({
            sector: i + 1,
            startIndex: start,
            endIndex: end,
            stats: calculateLapStats(sectorData)
        })
    }

    return sectors
}
